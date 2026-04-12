import f from "session-file-store";
import admin from "../config/firebaseAdmin.js";
import UserService from "./user.service.js";
import redisClient from "../config/redis.config.js";

const INVALID_TOKEN_KEY = 'fcm:invalid_tokens';

export default class PushNotificationService {
  static async sendNotification({ userId, title, body, data }, callback) {
    console.log(data);
    try {
      const user = await UserService.getUserDetails(userId);
      if (!user || !Array.isArray(user.fcm) || user.fcm.length === 0) {
        return callback(new Error("User or FCM tokens not found"));
      }
      // Collect all valid FCM tokens
      const tokens = user.fcm
        .map((fcmObj) => fcmObj.fcmToken)
        .filter((token) => !!token);

      if (tokens.length === 0) {
        return callback(new Error("No valid FCM tokens found"));
      }

      // console.log("Sending notifications to tokens:", tokens);

      // Send notification to each token using send
      const results = [];
      for (const token of tokens) {
        const message = {
          notification: {
            title: title,
            body: body,
          },
          token: token,
          data,
        };
        try {
          const response = await admin.messaging().send(message);
          results.push({ token, messageId: response, error: null });
        } catch (err) {
          results.push({ token, messageId: null, error: err });
        }
      }
      return callback(null, results);
    } catch (error) {
      console.error("Error sending message:", error);
      return callback(error);
    }
  }
  static async sendBatch(tokens, payload) {
    if (!tokens?.length)
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    const message = {
      tokens: tokens,
      notification: {
          title: payload.title,
          body: payload.body,
      },
      data: payload.data,
    };
    let response;
    try {
      const messaging = admin.messaging();
      if (typeof messaging.sendEachForMulticast === 'function') {
        response = await messaging.sendEachForMulticast(message);
      } else {
        response = await messaging.sendMulticast(message);
      }
      console.log("Batch notification response:", {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
    } catch (err) {
      console.error("FCM multicast fatal error", { message: err.message });
      throw err;
    }

     const invalidTokens = [];
  const results = response.responses;

  results.forEach((res, idx) => {
    if (!res.success) {
      const code = res.error?.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[idx]);
      } else {
        console.error('FCM token error', {
          token: tokens[idx].slice(-8),
          code,
          message: res.error?.message,
        });
      }
    }
  });

  // Persist invalid tokens to Redis set for async cleanup
  if (invalidTokens.length > 0) {
    const redis = redisClient.duplicate();
    await redis.sadd(INVALID_TOKEN_KEY, ...invalidTokens);
    console.log(`Flagged ${invalidTokens.length} invalid tokens for cleanup`);
  }

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  };


    
  }
  static async sendNotificationByFcmToken(
    { fcmToken, title, body, data = {} },
    callback,
  ) {
    try {
      const message = {
        notification: {
          title: title,
          body: body,
        },
        token: fcmToken,
        data,
      };
      const response = await admin.messaging().send(message);
      console.log("Successfully sent message:", response);
      return callback(null, { messageId: response, token: fcmToken });
    } catch (error) {
      console.error("Error sending message:", error);
      return callback(error);
    }
  }
}
