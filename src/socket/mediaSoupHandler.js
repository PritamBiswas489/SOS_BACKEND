import mediasoup from "mediasoup";
import "../config/environment.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { createSocket as createUdpSocket } from "dgram";
import { getProfileImage } from "../libraries/utility.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory where SOS audio recordings are saved.
// Override via SOS_AUDIO_DIR env var — avoids breakage if this file moves.
const SOS_AUDIO_DIR =
  process.env.SOS_AUDIO_DIR || path.resolve(__dirname, "../../uploads/sos-audio");

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

/**
 * Atomic RTP/RTCP port allocator.
 *
 * Why not getFreePort() (TCP probe + release)?
 *   That has a TOCTOU race — the OS reclaims the port the moment we close the
 *   TCP server, so another process can steal it before ffmpeg binds it.
 *   On a busy server this causes silent recording failures.
 *
 * Why not rtpPort + 1 for RTCP?
 *   getFreePort() only confirmed rtpPort was free — rtpPort+1 might be occupied
 *   by something else entirely.
 *
 * This counter always advances in steps of 2 (RTP + RTCP together) within a
 * dedicated range that nothing else on the server should touch.
 * Set RTP_PORT_START / RTP_PORT_END in .env to match your firewall rules.
 * Default: 40000–49998 (5000 recording slots — far more than MAX_ROOMS=200).
 */
const RTP_PORT_START = Number(process.env.RTP_PORT_START) || 40000;
const RTP_PORT_END   = Number(process.env.RTP_PORT_END)   || 49998; // must be even
let   _nextRtpPort   = RTP_PORT_START;

function allocateRtpPort() {
  const port = _nextRtpPort;
  _nextRtpPort += 2; // claim RTP + RTCP in one step
  if (_nextRtpPort > RTP_PORT_END) _nextRtpPort = RTP_PORT_START; // wrap around
  return port; // caller uses port (RTP) and port+1 (RTCP) — both reserved atomically
}

/**
 * Wait until ffmpeg has bound its UDP socket on `port`.
 *
 * Cross-platform strategy (works on both Windows dev and Linux production):
 *
 * PRIMARY  — UDP bind-probe (reliable on Linux):
 *   Try to bind a UDP socket to 0.0.0.0 on the same port.
 *   • EADDRINUSE → ffmpeg owns the port → ready ✅
 *   • bind succeeds → still free → retry
 *
 * FALLBACK — ffmpeg stderr sentinel (reliable on Windows):
 *   On Windows, UDP bind() does not reliably produce EADDRINUSE on 127.0.0.1.
 *   ffmpeg prints specific lines to stderr once fully initialised and listening.
 *   We watch for those in parallel — whichever probe resolves first wins.
 */
function waitForUdpReady(port, ffmpegProcess, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const deadline = Date.now() + timeoutMs;

    function settle() {
      if (settled) return;
      settled = true;
      if (ffmpegProcess) ffmpegProcess.stderr.off('data', onStderr);
      resolve();
    }

    function fail(msg) {
      if (settled) return;
      settled = true;
      if (ffmpegProcess) ffmpegProcess.stderr.off('data', onStderr);
      reject(new Error(msg));
    }

    // ── FALLBACK: ffmpeg stderr sentinel ─────────────────────────────────────
    // ffmpeg emits these lines once input is open and it is ready for RTP.
    // Works on both Windows and Linux regardless of bind behaviour.
    function onStderr(data) {
      const line = data.toString();
      if (
        line.includes('Press [q] to stop') ||
        line.includes('press [q] to stop') ||
        line.includes('muxing overhead')   ||
        line.includes('Output #0')
      ) {
        settle();
      }
    }
    if (ffmpegProcess) ffmpegProcess.stderr.on('data', onStderr);

    // ── PRIMARY: UDP bind-probe ───────────────────────────────────────────────
    // Bind on 0.0.0.0 so the probe conflicts with ffmpeg regardless of which
    // interface ffmpeg chose — fixes the 127.0.0.1 vs 0.0.0.0 mismatch on Windows.
    function probe() {
      if (settled) return;
      if (Date.now() > deadline) return fail(`UDP port ${port} not ready after ${timeoutMs}ms`);

      const sock = createUdpSocket('udp4');

      sock.once('error', (err) => {
        if (err.code === 'EADDRINUSE') return settle(); // ffmpeg owns it ✅
        try { sock.close(); } catch (_) {}
        setTimeout(probe, 150);
      });

      sock.bind(port, () => {
        sock.close(() => setTimeout(probe, 150));
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
  // These are tracked so the catch block can always clean them up on any error.
  // Recording errors are fully isolated — they never affect the producer,
  // consumers, or any listener transport.
  let plainTransport  = null;
  let recordingConsumer = null;
  let ffmpegProcess   = null;
  let sdpPath         = null;

  try {
    // ── Guard: must have a live producer before recording can start ──────────
    if (!room.producer || room.producer.closed) {
      console.error(`[recording:${roomId}] No active producer — cannot start recording`);
      return;
    }

    fs.mkdirSync(SOS_AUDIO_DIR, { recursive: true, mode: 0o755 });

    const rtpPort  = allocateRtpPort();
    const rtcpPort = rtpPort + 1;

    const outputFile = path.join(SOS_AUDIO_DIR, `${roomId}-${room.sosId}.mp3`);
    sdpPath          = path.join(SOS_AUDIO_DIR, `${roomId}-${room.sosId}.sdp`);

    // rtcpMux:false — ffmpeg needs separate RTP + RTCP ports
    plainTransport = await room.router.createPlainTransport({
      listenIp : { ip: "127.0.0.1", announcedIp: null },
      rtcpMux  : false,
      comedia  : false,
    });

    // Server-side consumer — router's own rtpCapabilities, no listener needed
    recordingConsumer = await plainTransport.consume({
      producerId      : room.producer.id,
      rtpCapabilities : room.router.rtpCapabilities,
      paused          : true,
    });

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
    console.log(`[recording:${roomId}] RTP:${rtpPort}  RTCP:${rtcpPort}`);

    // Spawn ffmpeg FIRST so it starts binding its UDP socket
    ffmpegProcess = spawn(FFMPEG_BIN, [
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
      console.error(`❌ ffmpeg spawn error for room ${roomId}:`, err.message)
    );
    ffmpegProcess.on("close", (code) => {
      const size = fs.existsSync(outputFile) ? fs.statSync(outputFile).size : 0;
      console.log(`🎙 SOS audio saved → ${outputFile} | ${size} bytes | exit:${code}`);
      try { fs.unlinkSync(sdpPath); } catch (_) {}
    });

    // Wait until ffmpeg is ready (cross-platform — see function jsdoc)
    await waitForUdpReady(rtpPort, ffmpegProcess);
    console.log(`[recording:${roomId}] ffmpeg UDP ready — connecting transport`);

    await plainTransport.connect({ ip: "127.0.0.1", port: rtpPort, rtcpPort });
    await recordingConsumer.resume();
    console.log(`[recording:${roomId}] Consumer resumed — RTP flowing ✅`);

    // Only set room.recording after everything succeeded
    room.recording = { ffmpegProcess, plainTransport, recordingConsumer, outputFile };
    console.log(`🎙 Recording started for room ${roomId} → ${outputFile}`);

  } catch (err) {
    // ── Isolated recording cleanup ────────────────────────────────────────────
    // Any error here is fully contained. The producer, send transport, and all
    // listener consumers are completely unaffected — streaming continues normally.
    console.error(`❌ [recording:${roomId}] Recording failed — streaming continues:`, err.message);

    // Kill ffmpeg if it was spawned
    if (ffmpegProcess) {
      try { ffmpegProcess.stdin.write('q\n'); ffmpegProcess.stdin.end(); } catch (_) {}
      setTimeout(() => {
        try { ffmpegProcess.kill('SIGKILL'); } catch (_) {}
      }, 3000);
    }

    // Close mediasoup recording resources
    try { if (recordingConsumer && !recordingConsumer.closed) recordingConsumer.close(); } catch (_) {}
    try { if (plainTransport    && !plainTransport.closed)    plainTransport.close();    } catch (_) {}

    // Clean up orphaned SDP file
    if (sdpPath) { try { fs.unlinkSync(sdpPath); } catch (_) {} }

    // Ensure room.recording stays null so stopRecording is a clean no-op
    room.recording = null;
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

const rooms = {}; // roomId → { router, creatorId, producer, transports: {}, recording: null, lastActivity: number }
// transports[socketId] = { sendTransport?, recvTransport?, producer?, consumer? }

// ─── NOTE ON SCALE ────────────────────────────────────────────────────────────
// `rooms` is in-process memory. Capacity is bounded by:
//   • RTC port range  : MEDIASOUP_RTC_MIN_PORT–MEDIASOUP_RTC_MAX_PORT
//                       Each transport uses 2 ports. Widen the range in .env for more capacity.
//   • RAM             : Each room holds a Router + N transports + ffmpeg process.
//   • Single worker   : For high concurrency, create one worker per CPU core and
//                       round-robin room creation across workers.
// ─────────────────────────────────────────────────────────────────────────────

// Max concurrent rooms — prevents unbounded memory growth.
// Override via MAX_ROOMS env var (e.g. MAX_ROOMS=500).
const MAX_ROOMS = Number(process.env.MAX_ROOMS) || 200;

// Abandon TTL — destroy rooms with no transports after this many ms of inactivity.
// Catches rooms where creator joined but never produced (router leak).
const ROOM_TTL_MS = Number(process.env.ROOM_TTL_MS) || 5 * 60 * 1000; // 5 min default

// Periodic TTL sweep — runs every minute
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of Object.entries(rooms)) {
    const isAbandoned =
      Object.keys(room.transports).length === 0 &&
      now - room.lastActivity > ROOM_TTL_MS;
    if (isAbandoned) {
      stopRecording(room, roomId);
      if (room.router) room.router.close();
      delete rooms[roomId];
      console.log(`🗑️  mediasoup room ${roomId} destroyed (TTL expired)`);
    }
  }
}, 60_000).unref(); // .unref() so the interval doesn't keep the process alive alone

// ─── Multi-worker pool ───────────────────────────────────────────────────────

const NUM_WORKERS = Number(process.env.MEDIASOUP_NUM_WORKERS) || os.cpus().length;
const workers = []; // pool of mediasoup workers
let workerIndex = 0; // round-robin cursor

async function createWorkerPool() {
  const minPort = Number(process.env.MEDIASOUP_RTC_MIN_PORT) || 10000;
  const maxPort = Number(process.env.MEDIASOUP_RTC_MAX_PORT) || 59999;
  // Divide the port range evenly across workers
  const portRange = Math.floor((maxPort - minPort) / NUM_WORKERS);

  for (let i = 0; i < NUM_WORKERS; i++) {
    const workerMinPort = minPort + i * portRange;
    const workerMaxPort = i === NUM_WORKERS - 1 ? maxPort : workerMinPort + portRange - 1;

    const w = await mediasoup.createWorker({
      logLevel: "warn",
      rtcMinPort: workerMinPort,
      rtcMaxPort: workerMaxPort,
    });

    w.on("died", () => {
      console.error(`❌ mediasoup worker[${i}] died — restarting`);
      workers[i] = null;
      // Respawn replacement worker with the same port slice
      mediasoup.createWorker({ logLevel: "warn", rtcMinPort: workerMinPort, rtcMaxPort: workerMaxPort })
        .then((replacement) => {
          replacement.on("died", () => process.exit(1));
          workers[i] = replacement;
          console.log(`✅ mediasoup worker[${i}] restarted, pid:`, replacement.pid);
        })
        .catch(() => process.exit(1));
    });

    workers.push(w);
    console.log(`✅ mediasoup worker[${i}] ready, pid: ${w.pid} ports: ${workerMinPort}-${workerMaxPort}`);
  }
}

/** Pick the next healthy worker in round-robin order. */
function getNextWorker() {
  // Skip any dead (null) worker slots
  for (let attempt = 0; attempt < workers.length; attempt++) {
    const w = workers[workerIndex % workers.length];
    workerIndex++;
    if (w) return w;
  }
  throw new Error("No healthy mediasoup workers available");
}

// ─── Bootstrap mediasoup worker pool (eager — runs at module load) ───────────

let _workerPoolPromise = null;

async function ensureWorker() {
  // Always await the pool promise — a resolved Promise returns immediately
  // so there is no overhead. Removing the workers.length check prevents a
  // misleading early-return during a worker respawn window where length is
  // still NUM_WORKERS but one slot is null.
  if (!_workerPoolPromise) {
    _workerPoolPromise = createWorkerPool();
  }
  await _workerPoolPromise;
}

// Start workers immediately at module load
ensureWorker().catch((err) =>
  console.error("❌ Failed to initialise mediasoup workers:", err)
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOrCreateRoom(roomId) {
  if (!rooms[roomId]) {
    // Hard cap — reject new rooms when the limit is reached
    if (Object.keys(rooms).length >= MAX_ROOMS) {
      throw new Error(`Server at capacity — maximum ${MAX_ROOMS} concurrent rooms`);
    }
    rooms[roomId] = {
      router: null,
      creatorId: null,
      producer: null,
      transports: {},
      recording: null,
      lastActivity: Date.now(),
    };
  } else {
    rooms[roomId].lastActivity = Date.now();
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

function cleanupSocket(socket, io) {
  const socketId = socket.id;
  for (const [roomId, room] of Object.entries(rooms)) {
    const slot      = room.transports[socketId];
    const isCreator = room.creatorId === socketId;

    // Previously: `if (!slot) continue` — this skipped rooms where the creator
    // joined (router created) but disconnected before ms:create-transport was
    // ever called, leaking the router and the room entry indefinitely.
    // Fix: also enter cleanup if this socket is the creatorId, slot or not.
    if (!slot && !isCreator) continue;

    // Close producer/recording if this socket is the creator
    if (isCreator) {
      stopRecording(room, roomId);
      if (slot?.producer) slot.producer.close();
      room.producer  = null;
      room.creatorId = null;
      io.to(roomId).emit('creator-left');
    }

    // Notify creator when a listener leaves
    if (room.creatorId && room.creatorId !== socketId) {
      io.to(room.creatorId).emit('listener-left', {
        socketId,
        userId:       socket.userId,
        userName:     socket.userName,
        profilePhoto: getProfileImage(socket.profilePhoto),
        phoneNumber:  socket.phoneNumber,
      });
    }

    // Close transport resources if the slot exists
    // (slot may be undefined if creator left before ms:create-transport)
    if (slot) {
      if (slot.consumer)      slot.consumer.close();
      if (slot.sendTransport) slot.sendTransport.close();
      if (slot.recvTransport) slot.recvTransport.close();
      delete room.transports[socketId];
    }

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
     
    cleanupSocket(socket, io);
  });

  // ── Join room ────────────────────────────────────────────────────────────
  // Both creator and listener call this first
  socket.on("ms:join-room", async ({ roomId, role, sosId = 0 }, callback) => {
     console.log(
        `User ${socket.userName} with ID ${socket.userId} joined room ${roomId} as ${role}`,
      );
    try {
      socket.join(roomId);
      const room = getOrCreateRoom(roomId); 
     

      if (!room.router) {
        room.router = await getNextWorker().createRouter({ mediaCodecs });
        console.log(`✅ mediasoup router created for room ${roomId}`);
      }

      if (role === "creator") {
        if (room.creatorId) {
          // Clean up previous creator before replacing
          const prevSlot = room.transports[room.creatorId];
          stopRecording(room, roomId);
          if (prevSlot) {
            if (prevSlot.producer) prevSlot.producer.close();
            if (prevSlot.consumer) prevSlot.consumer.close();
            if (prevSlot.sendTransport) prevSlot.sendTransport.close();
            if (prevSlot.recvTransport) prevSlot.recvTransport.close();
            delete room.transports[room.creatorId];
          }
          room.producer = null;
          room.creatorId = null; 
          
          io.to(roomId).emit("creator-left");
        }
        room.sosId = sosId;
        room.creatorId = socket.id;
      }
      callback({
        rtpCapabilities: room.router.rtpCapabilities,
        isCreator: role === "creator",
        hasProducer: !!room.producer,
      });

      if (role === "listener" && room.creatorId) {
          io.to(room.creatorId).emit("listener-joined", {
            socketId: socket.id,
            userName: socket.userName,
            userId: socket.userId,
            profilePhoto: getProfileImage(socket.profilePhoto),
            phoneNumber: socket.phoneNumber,
          });
      }
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
