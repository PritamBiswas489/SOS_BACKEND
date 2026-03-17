import "../config/environment.js";
import { buildDecryptRequest } from "../services/crypto.server.js";
import { buildEncryptedRequest, buildAes256GcmEncryptRequest, decryptAes256GcmResponse } from "../services/crypto.client.service.js";
import * as Sentry from "@sentry/node";

export default class EncryptDecryptController {
  static async encryptRequest(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const rt = decryptAes256GcmResponse(payload);
      console.log(rt);
      const response = await buildEncryptedRequest(rt);
      return {
        status: 200,
        data: response,
        message: "",
        error: {},
      };
    } catch (e) {
      console.log("Encryption error:", e.message);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("ENCRYPTION_ERROR"), reason: e.message },
      };
    }
  }
  static async decryptRequest(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const response = await buildDecryptRequest({
        envelope: payload.envelope,
        sig: payload.sig,
      });
      return {
        status: 200,
        data: response,
        message: "",
        error: {},
      };
    } catch (e) {
      console.log("Decryption error:", e.message);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("DECRYPTION_ERROR"), reason: e.message },
      };
    }
  }

  static async aes256GcmEncrypt(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const response =   buildAes256GcmEncryptRequest(payload);
      return {
        status: 200,
        data: response,
        message: "",
        error: {},
      };
    } catch (e) {
      console.log("Decryption error:", e.message);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("DECRYPTION_ERROR"), reason: e.message },
      };
    }
  }

  static async aes256GcmDecrypts(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const response =   decryptAes256GcmResponse(payload);
      return {
        status: 200,
        data: response,
        message: "",
        error: {},
      };
    } catch (e) {
      console.log("Decryption error:", e.message);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("DECRYPTION_ERROR"), reason: e.message },
      };
    }
  }
}
