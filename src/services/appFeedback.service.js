import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";

const { Op, AppFeedback } = db;

export default class AppFeedbackService {
    static async submitFeedback({ userId, payload}, callback) {
        try {
            const createdFeedback = await AppFeedback.create({
                user_id: userId,
                rating: payload.rating || 1,
                feedback_type: payload.feedbackType || "general",
                message: payload.message || null,
                screenshot_url: payload.screenshotUrl || null,
                app_version: payload.appVersion || null,
                device_info: payload.deviceInfo || null,
                os_version: payload.osVersion || null,
                allow_contact: payload.allowContact || false,
                status: "new"
            });
            return callback(null, { data: createdFeedback });
        }catch (error) {
            console.log("ERROR In submitFeedback", error?.message || error);
            logger.error("ERROR In submitFeedback", { error });
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
            return callback(new Error("SUBMIT_FEEDBACK_FAILED"), null);
        }
    }
}
