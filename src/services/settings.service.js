import { MAX_PROFILE_IMAGE_SIZE_MB } from "../middlewares/profileImageUpload.js";
import { CHAT_MEDIA_FILE_SIZES } from "../middlewares/chatMediaupload.js";
import { EVIDENCE_FILE_SIZES } from "../middlewares/evidenceUpload.js";
export default class SettingsService {
    static async getSettings({ userId }, callback) {
        try {
            const siteSettings = {
                'PROFILE_IMAGE_SIZE': MAX_PROFILE_IMAGE_SIZE_MB * 1024 * 1024,
                'CHAT_MEDIA_FILE_SIZES': CHAT_MEDIA_FILE_SIZES,
                'EVIDENCE_FILE_SIZES': EVIDENCE_FILE_SIZES,
            }

            return callback(null, { data: {siteSettings} });

        }catch (error) {
         console.log("ERROR In getSettings", error?.message || error);
         logger.error("ERROR In getSettings", { error });
         process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
         return callback(new Error("GET_SETTINGS_FAILED"), null);
        }

    }

}