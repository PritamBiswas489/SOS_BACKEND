import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";

const { AppFeedback, AppFeedbackAttachments } = db;

const parseBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return false;
};

export default class AppFeedbackService {
    static async submitFeedback({ userId, payload }, callback) {
        const transaction = await db.sequelize.transaction();
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
                allow_contact: parseBoolean(payload.allowContact),
                status: "new"
            }, { transaction });

            const feedbackFiles = Array.isArray(payload.feedback_files)
                ? payload.feedback_files
                : [];

            if (feedbackFiles.length > 0) {
                await AppFeedbackAttachments.bulkCreate(
                    feedbackFiles.map((file) => ({
                        feedback_id: createdFeedback.id,
                        file_type: file.file_type,
                        file_url: file.file_url,
                    })),
                    { transaction },
                );
            }

            const feedback = await AppFeedback.findByPk(createdFeedback.id, {
                include: [
                    {
                        model: AppFeedbackAttachments,
                        as: "feedback_files",
                    },
                ],
                transaction,
            });

            await transaction.commit();

            return callback(null, { data: feedback });
        } catch (error) {
            await transaction.rollback();
            console.log("ERROR In submitFeedback", error?.message || error);
            logger.error("ERROR In submitFeedback", { error });
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
            return callback(new Error("SUBMIT_FEEDBACK_FAILED"), null);
        }
    }
}
