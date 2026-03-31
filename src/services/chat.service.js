import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { UserChats, UserChatMessageReceipts } = db;

export default class ChatService {
  static async saveChatMessage(payload, callback) {
    try {
      const {
        sender_id,
        recipient_id,
        text,
        media_url,
        media_type,
        reply_to,
        room_id,
      } = payload;
      const newMessage = await UserChats.create({
        sender_id,
        recipient_id,
        text,
        media_url,
        media_type,
        reply_to,
        room_id,
      });
      return callback(null, newMessage);
    } catch (error) {
      console.error("Error saving chat message:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("SAVE_CHAT_MESSAGE_FAILED"));
    }
  }
  static async updateMessageStatus(messageId, status) {
    try {
      await UserChats.update(
        { status },
        { where: { id: messageId, status: "sent" } }
      );
    } catch (error) {
      console.error("Error updating message status:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      throw new Error("UPDATE_MESSAGE_STATUS_FAILED");
    }
  }
  static async saveMessageReceipt({ messageId, userId, status }) {
    try{
        await UserChatMessageReceipts.upsert({
        message_id: messageId,
        user_id: userId,
        status
      });
    } catch (error) {
      console.error("Error saving message receipt:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      throw new Error("SAVE_MESSAGE_RECEIPT_FAILED");
    }
  }
  static async getMessageDetails(messageId) {
    try {
      const message = await UserChats.findOne({ where: { id: messageId } });
      return message;
    } catch (error) {
      console.error("Error fetching message details:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      throw new Error("FETCH_MESSAGE_DETAILS_FAILED");
    }
  }
}
