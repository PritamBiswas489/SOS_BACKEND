import mediasoup from "mediasoup";
import "../config/environment.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import net from "net";
import { fileURLToPath } from "url";
import { createSocket as createUdpSocket } from "dgram";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory where SOS audio recordings are saved
const SOS_AUDIO_DIR = path.resolve(__dirname, "../../uploads/sos-audio");

// ffmpeg binary path — override via FFMPEG_PATH env var for custom installs
// e.g. FFMPEG_PATH=/usr/local/bin/ffmpeg  or  FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg";

// ─── Mediasoup config ────────────────────────────────────────────────────────

const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];

// ─── ICE / STUN / TURN config ────────────────────────────────────────────────

const getIceServers = () => [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: [
      `turn:${process.env.TURN_SERVER_HOST}:3478`,
      `turn:${process.env.TURN_SERVER_HOST}:3478?transport=tcp`,
      `turns:${process.env.TURN_SERVER_HOST}:5349`,
    ],
    username: process.env.TURN_SERVER_USERNAME,
    credential: process.env.TURN_SERVER_CREDENTIAL,
  },
];

const getWebRtcTransportOptions = () => ({
  listenIps: [
    {
      ip: "0.0.0.0",
      announcedIp: process.env.ANNOUNCED_IP,
    },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  iceServers: getIceServers(),
});  

// ─── Recording helpers ───────────────────────────────────────────────────────

/** Allocate a free OS UDP port on 127.0.0.1. */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

/**
 * Wait until ffmpeg has bound its UDP socket on `port`.
 * Probes every 100 ms — far more reliable than a fixed setTimeout.
 */
function waitForUdpReady(port, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function probe() {
      const sock = createUdpSocket("udp4");
      sock.send(Buffer.from([0x00]), port, "127.0.0.1", (err) => {
        sock.close();
        if (!err) return resolve();
        if (Date.now() > deadline)
          return reject(new Error(`UDP port ${port} not ready after ${timeoutMs}ms`));
        setTimeout(probe, 100);
      });
    }
    probe();
  });
}

/**
 * Pipe `room.producer` through a server-side PlainTransport → ffmpeg → .mp3 file.
 * Called immediately after the producer is created in ms:produce.
 *
 * Fixes applied vs original:
 *  FIX 1 — spawn ffmpeg FIRST, wait for UDP bind, THEN connect transport & resume.
 *           Original 500 ms setTimeout was a race condition.
 *  FIX 2 — rtcpMux:false + separate rtcpPort so ffmpeg gets independent RTP/RTCP ports.
 *  FIX 3 — consumer created BEFORE plainTransport.connect() so real payloadType is known.
 *  FIX 4 — SDP includes a=fmtp (required for Opus) and explicit a=rtcp: line.
 */
async function startRecording(room, roomId) {
  try {
    // ── Guard: must have a live producer before recording can start ──────────
    // Recording is 100% independent of listeners — it taps directly from the
    // producer via a server-side PlainTransport. No listener needs to be
    // connected for this to work.
    if (!room.producer || room.producer.closed) {
      console.error(`[recording:${roomId}] No active producer — cannot start recording`);
      return;
    }

    fs.mkdirSync(SOS_AUDIO_DIR, { recursive: true, mode: 0o755 });

    // Allocate two ports: one for RTP, one for RTCP
    const rtpPort = await getFreePort();
    const rtcpPort = rtpPort + 1;

    const timestamp  = Date.now();
    const outputFile = path.join(SOS_AUDIO_DIR, `${roomId}-${timestamp}.mp3`);
    const sdpPath    = path.join(SOS_AUDIO_DIR, `${roomId}-${timestamp}.sdp`);

    // rtcpMux:false — ffmpeg needs separate RTP + RTCP ports
    const plainTransport = await room.router.createPlainTransport({ 
      listenIp : { ip: "127.0.0.1", announcedIp: null },
      rtcpMux  : false,
      comedia  : false,
    });

    // Server-side consumer using router's OWN rtpCapabilities — NO listener needed.
    // This is what makes recording listener-independent: we consume directly from
    // the router, not from any client transport.
    const recordingConsumer = await plainTransport.consume({
      producerId      : room.producer.id,
      rtpCapabilities : room.router.rtpCapabilities,  // ← server caps, not client caps
      paused          : true,
    });

    // FIX 4 — complete SDP: a=fmtp for Opus + explicit a=rtcp port
    const codec = recordingConsumer.rtpParameters.codecs[0];
    const pt    = codec.payloadType;

    const sdp = [
      "v=0",
      "o=- 0 0 IN IP4 127.0.0.1",
      "s=sos-recording",
      "c=IN IP4 127.0.0.1",
      "t=0 0",
      `m=audio ${rtpPort} RTP/AVP ${pt}`,
      `a=rtpmap:${pt} opus/${codec.clockRate}/${codec.channels || 2}`,
      `a=fmtp:${pt} minptime=10;useinbandfec=1`,
      `a=rtcp:${rtcpPort}`,
      "a=recvonly",
    ].join("\r\n") + "\r\n";

    fs.writeFileSync(sdpPath, sdp);
    console.log(`[recording:${roomId}] SDP →\n${sdp}`);
    console.log(`[recording:${roomId}] RTP:${rtpPort}  RTCP:${rtcpPort}`);

    // FIX 1 — spawn ffmpeg FIRST (so it starts binding the UDP socket)
     const ffmpegProcess = spawn(FFMPEG_BIN, [
          "-loglevel",           "warning",
          "-protocol_whitelist", "file,rtp,udp,crypto",
          "-i",                  sdpPath,
          "-vn",
          "-acodec",             "libmp3lame",
          "-ab",                 "128k",
          "-ar",                 "44100",
          "-ac",                 "2",
          "-f",                  "mp3",
          "-y",
          outputFile,
        ], { stdio: ["pipe", "pipe", "pipe"] });

    ffmpegProcess.stderr.on("data", (d) =>
      console.log(`[ffmpeg:${roomId}] ${d.toString().trim()}`)
    );
    ffmpegProcess.on("error", (err) =>
      console.error(`❌ ffmpeg error for room ${roomId}:`, err.message)
    );
    ffmpegProcess.on("close", (code) => {
      const size = fs.existsSync(outputFile) ? fs.statSync(outputFile).size : 0;
      console.log(`🎙 SOS audio saved → ${outputFile} | ${size} bytes | exit:${code}`);
      try { fs.unlinkSync(sdpPath); } catch (_) {}
    });

    // FIX 1 — wait until ffmpeg's UDP socket is actually bound, THEN connect
    await waitForUdpReady(rtpPort);
    console.log(`[recording:${roomId}] ffmpeg UDP ready — connecting transport`);

    // Now connect plainTransport so mediasoup knows where to send RTP
    await plainTransport.connect({ ip: "127.0.0.1", port: rtpPort, rtcpPort });

    // Finally resume — RTP starts flowing into ffmpeg
    await recordingConsumer.resume();
    console.log(`[recording:${roomId}] Consumer resumed — RTP flowing ✅`);

    room.recording = { ffmpegProcess, plainTransport, recordingConsumer, outputFile };
    console.log(`🎙 Recording started for room ${roomId} → ${outputFile}`);
  } catch (err) {
    console.error(`❌ startRecording error for room ${roomId}:`, err);
  }
}

/**
 * Stop the ffmpeg recording for a room.
 * Order matters: send 'q' to ffmpeg FIRST so it flushes the MP3 trailer,
 * THEN close mediasoup consumer/transport after ffmpeg exits.
 * Closing transport first cuts off RTP before ffmpeg can flush — 0-byte file.
 */
function stopRecording(room, roomId) {
  if (!room.recording) return;
  const { ffmpegProcess, plainTransport, recordingConsumer, outputFile } =
    room.recording;
  room.recording = null;

  if (ffmpegProcess) {
    // 1. Tell ffmpeg to flush and write MP3 trailer gracefully
    try {
      ffmpegProcess.stdin.write("q\n");
      ffmpegProcess.stdin.end();
    } catch (_) {}

    // 2. Close mediasoup resources AFTER ffmpeg has exited
    ffmpegProcess.once("close", () => {
      try {
        if (recordingConsumer && !recordingConsumer.closed) recordingConsumer.close();
        if (plainTransport    && !plainTransport.closed)    plainTransport.close();
      } catch (_) {}
    });

    // Safety kill after 5 s in case ffmpeg hangs
    const killTimer = setTimeout(() => {
      try { ffmpegProcess.kill("SIGKILL"); } catch (_) {}
    }, 5000);
    ffmpegProcess.once("close", () => clearTimeout(killTimer));
  } else {
    // No ffmpeg process — just close mediasoup resources directly
    try {
      if (recordingConsumer && !recordingConsumer.closed) recordingConsumer.close();
      if (plainTransport    && !plainTransport.closed)    plainTransport.close();
    } catch (_) {}
  }

  console.log(`🛑 Recording stopping for room ${roomId} → ${outputFile}`);
}

// ─── State ───────────────────────────────────────────────────────────────────

let worker; // single mediasoup worker — created once
const rooms = {}; // roomId → { router, creatorId, producer, transports: {}, recording: null }
// transports[socketId] = { sendTransport?, recvTransport?, producer?, consumer? }

// ─── Bootstrap mediasoup worker (eager — runs at module load) ───────────────
// Initialized immediately so socket event handlers are always ready when the
// first connection arrives. Storing the promise guards against concurrent calls.

let _workerPromise = null;

async function ensureWorker() {
  if (worker) return;
  if (!_workerPromise) {
    _workerPromise = mediasoup
      .createWorker({
        logLevel: "warn",
        rtcMinPort: Number(process.env.MEDIASOUP_RTC_MIN_PORT) || 10000,
        rtcMaxPort: Number(process.env.MEDIASOUP_RTC_MAX_PORT) || 10100,
      })
      .then((w) => {
        worker = w;
        worker.on("died", () => {
          console.error("❌ mediasoup worker died — exiting");
          process.exit(1);
        });
        console.log("✅ mediasoup worker ready, pid:", worker.pid);
      });
  }
  await _workerPromise;
}

// Start worker immediately at module load so it is ready before any connection
ensureWorker().catch((err) =>
  console.error("❌ Failed to initialise mediasoup worker:", err)
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOrCreateRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      router: null,
      creatorId: null,
      producer: null,
      transports: {},
      recording: null,
    };
  }
  return rooms[roomId];
}

function ensureTransportSlot(roomId, socketId) {
  const room = rooms[roomId];
  if (!room.transports[socketId]) {
    room.transports[socketId] = {};
  }
  return room.transports[socketId];
}

function cleanupSocket(socketId, io) {
  for (const [roomId, room] of Object.entries(rooms)) {
    if (!room.transports[socketId]) continue;

    const slot = room.transports[socketId];

    // Close producer if this socket is the creator
    if (room.creatorId === socketId) {
      // Stop recording first so ffmpeg flushes the file before transport closes
      stopRecording(room, roomId);
      if (slot.producer) slot.producer.close();
      room.producer = null;
      room.creatorId = null;
      io.to(roomId).emit("creator-left");
    }

    if (slot.consumer) slot.consumer.close();
    if (slot.sendTransport) slot.sendTransport.close();
    if (slot.recvTransport) slot.recvTransport.close();

    delete room.transports[socketId];

    // Destroy room when empty
    if (Object.keys(room.transports).length === 0) {
      if (room.router) room.router.close();
      delete rooms[roomId];
      console.log(`🗑️  mediasoup room ${roomId} destroyed`);
    }
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const registerMediaSoupHandler = async (io, socket) => {
  // Worker should already be ready (started at module load).
  // This await is a safety net in case the server starts and a client
  // connects before the worker promise resolves.
  await ensureWorker();

  // ── Disconnect cleanup ──────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[MediaSoup] Socket disconnected: ${socket.id}`);
    cleanupSocket(socket.id, io);
  });

  // ── Join room ────────────────────────────────────────────────────────────
  // Both creator and listener call this first
  socket.on("ms:join-room", async ({ roomId, role }, callback) => {
     console.log(
        `User ${socket.userName} with ID ${socket.userId} joined room ${roomId} as ${role}`,
      );
    try {
      socket.join(roomId);
      const room = getOrCreateRoom(roomId); 
     

      if (!room.router) {
        room.router = await worker.createRouter({ mediaCodecs });
        console.log(`✅ mediasoup router created for room ${roomId}`);
      }

      if (role === "creator") {
        if (room.creatorId) {
          return callback({ error: "Room already has a creator" });
        }
        room.creatorId = socket.id;
      }

      callback({
        rtpCapabilities: room.router.rtpCapabilities,
        isCreator: role === "creator",
        hasProducer: !!room.producer,
      });
    } catch (err) {
      console.error("❌ ms:join-room error", err);
      callback({ error: err.message });
    }
  });

  // ── Create WebRTC transport (called by BOTH creator and listener) ─────────
  socket.on("ms:create-transport", async ({ roomId, direction }, callback) => {
    try {
      const room = rooms[roomId];
      if (!room) return callback({ error: "Room not found" });

      const transport = await room.router.createWebRtcTransport(
        getWebRtcTransportOptions()
      );

      console.log(
        "ICE candidates:",
        JSON.stringify(transport.iceCandidates)
      );

      transport.on("dtlsstatechange", (state) => {
        if (state === "closed") transport.close();
      });

      ensureTransportSlot(roomId, socket.id);

      if (direction === "send") {
        rooms[roomId].transports[socket.id].sendTransport = transport;
      } else {
        rooms[roomId].transports[socket.id].recvTransport = transport;
      }

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        iceServers: getIceServers(),
      });
    } catch (err) {
      console.error("❌ ms:create-transport error", err);
      callback({ error: err.message });
    }
  });

  // ── Connect transport (ICE + DTLS handshake) ─────────────────────────────
  socket.on(
    "ms:connect-transport",
    async ({ roomId, transportId, dtlsParameters }, callback) => {
      try {
        const room = rooms[roomId];
        const slot = room?.transports[socket.id];
        if (!slot) return callback({ error: "Transport slot not found" });

        const transport =
          slot.sendTransport?.id === transportId
            ? slot.sendTransport
            : slot.recvTransport;

        if (!transport) return callback({ error: "Transport not found" });

        await transport.connect({ dtlsParameters });
        callback({});
      } catch (err) {
        console.error("❌ ms:connect-transport error", err);
        callback({ error: err.message });
      }
    }
  );

  // ── Produce — audio only (creator only) ──────────────────────────────────
  socket.on("ms:produce", async ({ roomId, kind, rtpParameters }, callback) => {
    try {
      if (kind !== "audio") {
        return callback({ error: "Only audio streams are supported" });
      }

      const room = rooms[roomId];
      if (!room) return callback({ error: "Room not found" });
      if (room.creatorId !== socket.id)
        return callback({ error: "Only the creator can produce" });

      const transport = room.transports[socket.id]?.sendTransport;
      if (!transport) return callback({ error: "Send transport not found" });

      const producer = await transport.produce({ kind, rtpParameters });
      room.transports[socket.id].producer = producer;
      room.producer = producer;  // assign FIRST — startRecording reads room.producer

      producer.on("transportclose", () => {
        stopRecording(room, roomId);
        room.producer = null;
        io.to(roomId).emit("creator-left");
      });

      producer.on("score", (score) => {
        // Optional: log producer score for debugging audio quality
        // console.log(`[producer:${roomId}] score:`, score);
      });

      // Notify listeners that a producer is available (independent of recording)
      socket.to(roomId).emit("ms:new-producer", { producerId: producer.id });

      // ── Start server-side recording immediately ───────────────────────────
      // Recording is INDEPENDENT of listeners. Audio is saved to disk as soon
      // as the creator starts speaking — whether 0 or 100 listeners are connected.
      // We do NOT await here so the callback returns to the client immediately
      // while recording bootstraps in the background.
      startRecording(room, roomId).catch((err) =>
        console.error(`❌ startRecording failed for room ${roomId}:`, err)
      );

      callback({ id: producer.id });
    } catch (err) {
      console.error("❌ ms:produce error", err);
      callback({ error: err.message });
    }
  });

  // ── Consume (listener only) ──────────────────────────────────────────────
  socket.on("ms:consume", async ({ roomId, rtpCapabilities }, callback) => {
    try {
      const room = rooms[roomId];
      if (!room || !room.producer)
        return callback({ error: "No active producer" });

      if (
        !room.router.canConsume({
          producerId: room.producer.id,
          rtpCapabilities,
        })
      ) {
        return callback({
          error: "Cannot consume — incompatible RTP capabilities",
        });
      }

      const transport = room.transports[socket.id]?.recvTransport;
      if (!transport) return callback({ error: "Recv transport not found" });

      const consumer = await transport.consume({
        producerId: room.producer.id,
        rtpCapabilities,
        paused: false,
      });

      room.transports[socket.id].consumer = consumer;

      consumer.on("transportclose", () => consumer.close());
      consumer.on("producerclose", () => {
        consumer.close();
        socket.emit("ms:producer-closed");
      });

      callback({
        id: consumer.id,
        producerId: room.producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    } catch (err) {
      console.error("❌ ms:consume error", err);
      callback({ error: err.message });
    }
  });

  // ── Resume consumer (call after consume to unblock audio) ────────────────
  socket.on("ms:resume-consumer", async ({ roomId }, callback) => {
    try {
      const consumer = rooms[roomId]?.transports[socket.id]?.consumer;
      if (!consumer) return callback({ error: "Consumer not found" });
      await consumer.resume();
      callback({});
    } catch (err) {
      console.error("❌ ms:resume-consumer error", err);
      callback({ error: err.message });
    }
  });
};
