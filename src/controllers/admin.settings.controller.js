import SettingsService from "../services/settings.service.js";
import * as Sentry from "@sentry/node";
export default class AdminSettingsController {
     static async getAllSettings(request) {
        const { payload, headers: { i18n }, user } = request;
        try {
            const settings = await SettingsService.getSettings();
            if (settings.ERROR) {
                return {
                    status: 500,
                    data: [],
                    error: { message: i18n.__("CATCH_ERROR"), reason: "Error fetching settings" },
                };
            }
            return {
                status: 200,
                data: settings.data,
                message: i18n.__("SETTINGS_FETCHED_SUCCESSFULLY"),
            };
        } catch (e) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            return {
                status: 500,
                data: [],
                error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
            };
        }          
     }
     static async updateSettings(request) {
        const { payload, headers: { i18n }, user } = request;
        try {
            Object.values(payload).forEach(setting => {
                  SettingsService.updateSettings(setting.key, setting.value)
            });
            return {
                status: 200,
                data: [],
                message: i18n.__("SETTINGS_UPDATED_SUCCESSFULLY"),
            };
        }catch (e) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            return {
                status: 500,
                data: [],
                error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
            };
        }       
     }

    static async getSettingByKey(request) {
         const { payload, headers: { i18n }, user } = request;
         try {
                const setting = await SettingsService.getSetting(payload.key);
                if (setting.ERROR) {
                    return {
                        status: 500,
                        data: [],
                        error: { message: i18n.__("CATCH_ERROR"), reason: "Error fetching setting" },
                    };
                }
                return {
                    status: 200,
                    data: setting.data,
                    message: i18n.__("SETTING_FETCHED_SUCCESSFULLY"),
                };
            } catch (e) {
                process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
                return {
                    status: 500,
                    data: [],
                    error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
                };
            }
            
        
    }
}