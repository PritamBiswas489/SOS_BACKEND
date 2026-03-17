import admin from "../config/firebaseAdmin.js";
import UserService from "./user.service.js";

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
  static async sendNotificationByFcmToken(
    { fcmToken, title, body, data },
    callback
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
