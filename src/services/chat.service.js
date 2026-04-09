import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import moment from "moment";
const { UserChats, UserChatMessageReceipts, User } = db;

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
        location_json
      } = payload;
      const newMessage = await UserChats.create({
        sender_id,
        recipient_id,
        text,
        media_url,
        media_type,
        reply_to,
        room_id,
        location_json

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
        { where: { id: messageId, status: { [db.Sequelize.Op.ne]: status } } }
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
  static async updateUserOnlineStatus(userId, isOnline) {
    try {
      await User.update(
        { is_online: isOnline, last_seen:  moment().tz(process.env.timezone).format() },
        { where: { id: userId } }
      );
    } catch (error) {
      console.error("Error updating user online status:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
       
    }
  }
  static async getChatHistory(roomId, limit = 50, page = 1) {
    try {
      const whereClause = { room_id: roomId };
      const offset = (page - 1) * limit;
      const messages = await UserChats.findAll({
        where: whereClause,
        order: [["created_at", "DESC"]],
        include:[
          {
            model: UserChats,
            as: "reply_to_message",
            required: false,
          }
        ],
        limit,
        offset
      });
      const formattedMessages =  messages.reverse().map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        text: msg.text,
        mediaUrl: msg.media_url,
        mediaType: msg.media_type,
        replyTo: msg.reply_to,
        status: msg.status,
        timestamp: msg.created_at,
        locationJson: msg.location_json,
        reply_to_message: msg.reply_to_message || null
      }));
      return formattedMessages;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      throw new Error("FETCH_CHAT_HISTORY_FAILED");
    }
  }
}
