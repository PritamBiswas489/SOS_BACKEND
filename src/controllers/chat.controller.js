import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import { getMediaType } from "../middlewares/chatMediaupload.js";
import logger from "../config/winston.js";
 
export default class ChatController {
  static async uploadChatMedia(request) {
    const { file, payload, headers, user  } = request;
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
}
