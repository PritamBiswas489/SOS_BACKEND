import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import { getMediaType } from "../middlewares/chatMediaupload.js";
import logger from "../config/winston.js";
import ChatService from "../services/chat.service.js";
 
export default class ChatController {
  static async uploadChatMedia(request) {
    const { file, payload, headers, user } = request;
    try {
      const baseUrl = process.env.BASE_URL;
      const media = {
        url: `${baseUrl}/uploads/${file.destination.split(/[/\\]/).pop()}/${file.filename}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        mediaType: getMediaType(file.mimetype),
        size: file.size,
      };
      return {
        status: 200,
        data: media,
        message: headers?.i18n.__("CHAT_MEDIA_UPLOAD_SUCCESSFUL"),
        error: null,
      };
    } catch (err) {
      logger.error("ERROR In uploadChatMedia", { error: err });
      return {
        status: 500,
        data: null,
        message: headers?.i18n.__("CHAT_MEDIA_UPLOAD_FAILED"),
        error: err.message,
      };
    }
  }
  static async getChatHistory(request) {
    const payload = request.payload;
    const headers = request.headers;
    const user = request.user;
    const roomId = payload.roomId;
    const limit = parseInt(payload.limit) || 20;
    const page = parseInt(payload.page) || 1;

    return new Promise((resolve) => {
      ChatService.getChatRecords(
        {roomId, limit, page, userId: user.id, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_CHAT_HISTORY_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("GET_CHAT_HISTORY_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
}
