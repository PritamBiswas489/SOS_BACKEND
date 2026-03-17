import {
  createPrivateKey,
  createPublicKey,
  hkdfSync,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  sign,
  verify,
  diffieHellman,
} from "crypto";

export function deriveAesKey({ privPem, pubPem, salt }) {
  const privKey = createPrivateKey(privPem);
  const pubKey = createPublicKey(pubPem);

  // Derive raw shared secret (X25519)
  const secret = diffieHellman({ privateKey: privKey, publicKey: pubKey });

  // Derive AES-256 key from shared secret
  return hkdfSync(
    "sha256",
    secret,
    salt,
    Buffer.from("wallet-transfer-v1"),
    32
  );
}

export function encryptJson(aesKey, obj) {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
  const pt = Buffer.from(JSON.stringify(obj), "utf8");

  const ct = Buffer.concat([cipher.update(pt), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    ct: ct.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptJson(aesKey, { iv, ct, tag }) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    aesKey,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(ct, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(pt.toString("utf8"));
}

export function signEnvelope(privPem, obj) {
  const data = Buffer.from(JSON.stringify(obj));
  return sign(null, data, createPrivateKey(privPem)).toString("base64");
}

export function verifyEnvelope(pubPem, obj, sig) {
  const data = Buffer.from(JSON.stringify(obj));
  return verify(
    null,
    data,
    createPublicKey(pubPem),
    Buffer.from(sig, "base64")
  );
}
