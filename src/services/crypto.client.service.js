import "../config/environment.js";
import { randomBytes } from "crypto";
import { deriveAesKey, encryptJson, signEnvelope } from "./crypto.service.js";

import { gcm } from "@noble/ciphers/aes.js";

const CLIENT_X25519_PRIV_PEM = process.env.CLIENT_X25519_PRIV_PEM;
const CLIENT_ED25519_PRIV_PEM = process.env.CLIENT_ED25519_PRIV_PEM;
const SERVER_X25519_PUB_PEM = process.env.SERVER_X25519_PUB_PEM;
const AES_key = process.env.AES_key;

export async function buildEncryptedRequest(payload) {
  const salt = randomBytes(16);
  const aesKey = deriveAesKey({
    privPem: CLIENT_X25519_PRIV_PEM,
    pubPem: SERVER_X25519_PUB_PEM,
    salt,
  });

  const enc = encryptJson(aesKey, {
    ...payload,
  });

  const envelope = {
    salt: salt.toString("base64"),
    iv: enc.iv,
    ct: enc.ct,
    tag: enc.tag,
    kid: "client-v1",
  };

  const sig = signEnvelope(CLIENT_ED25519_PRIV_PEM, envelope);

  return { envelope, sig };
}

const enc = new TextEncoder();
const dec = new TextDecoder();

const key = enc.encode(AES_key); // 32-byte AES-256 key
//encrypt
export  function buildAes256GcmEncryptRequest(payload) {
  const iv = randomBytes(12);  
  console.log("IV type:", iv.constructor.name, "length:", iv.length); // should log Uint8Array 12
  const jsonString = JSON.stringify(payload);
  const aes = gcm(key, iv);  
  const encrypted = aes.encrypt(enc.encode(jsonString));
  console.log("Encrypted length:", encrypted.length);

  return {
    iv: Buffer.from(iv).toString("base64"),
    ct: Buffer.from(encrypted).toString("base64"),
  };
}
//decrypt
export function decryptAes256GcmResponse({ iv, ct }) {
  const ivBuf = Buffer.from(iv, "base64");
  const ctBuf = Buffer.from(ct, "base64");

  // 👇 construct AES-GCM with same iv
  const aes = gcm(key, ivBuf);
  const decrypted = aes.decrypt(ctBuf);

  return JSON.parse(dec.decode(decrypted));
}