import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
import AppFeedbackService from "../services/appFeedback.service.js";

export default class AppFeedbackController {
    static async submitFeedback(request) {
        const { payload, headers: { i18n }, user } = request;
        const userId = user?.id;
        return new Promise(async (resolve) => {
            AppFeedbackService.submitFeedback(
                { userId, payload },
                (err, response) => {
                    if (err) {
                        return resolve({
                            status: 400,
                            data: null,
                            error: {
                                message: i18n.__(
                                    err.message || "SUBMIT_FEEDBACK_FAILED",
                                ),
                                reason: err.message,
                            },
                        });
                    }
                    return resolve({
                        status: 200,
                        data: response.data,
                        message: i18n.__("SUBMIT_FEEDBACK_SUCCESSFUL"),
                        error: null,
                    });
                },
            );
        });
    }

}