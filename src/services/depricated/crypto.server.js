import "../config/environment.js";

 

import {verifyEnvelope, deriveAesKey, decryptJson } from "./crypto.service.js";

const SERVER_X25519_PRIV_PEM = process.env.SERVER_X25519_PRIV_PEM;
const CLIENT_X25519_PUB_PEM = process.env.CLIENT_X25519_PUB_PEM;
const CLIENT_ED25519_PUB_PEM = process.env.CLIENT_ED25519_PUB_PEM;

export async function buildDecryptRequest(payload) {

    const { envelope, sig } = payload;
    if (!verifyEnvelope(CLIENT_ED25519_PUB_PEM, envelope, sig)) {
      return { error: "Invalid signature" };
    }

    const salt = Buffer.from(envelope.salt, "base64");
    const aesKey =  deriveAesKey({
      privPem: SERVER_X25519_PRIV_PEM,
      pubPem: CLIENT_X25519_PUB_PEM,
      salt,
    });

    const data =  decryptJson(aesKey, envelope);

    return data;

}