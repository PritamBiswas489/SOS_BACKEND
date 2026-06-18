import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import SettingsService from "../services/settings.service.js";

export default class SettingsController {
    static async getSettings(request) {
        const { payload, headers, user } = request;
        const userid = user?.id;
        return new Promise((resolve) => {
            SettingsService.getSettings(
                { userId: userid },
                (err, response) => {
                    if (err) {
                        return resolve({
                            status: 400,
                            data: null,
                            error: {
                                message: headers?.i18n.__(
                                    err.message || "GET_SETTINGS_FAILED",
                                ),
                                reason: err.message,
                            },
                        });
                    }
                    return resolve({
                        status: 200,
                        data: response.data,
                        message: headers?.i18n.__("GET_SETTINGS_SUCCESSFUL"),
                        error: null,
                    });
                },
            );  
           
        });


    }

}  