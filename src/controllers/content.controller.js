import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import FaqService from "../services/faq.service.js";
import SettingsService from "../services/settings.service.js";
export default class ContentController {
    static async listFaqs(request) {
        const { payload, headers: { i18n }, user } = request;

        try {
            const result = await FaqService.listFaqs();

            if (result.ERROR) {
                return {
                    status: 500,
                    data: [],
                    error: { message: i18n.__("CATCH_ERROR"), reason: result.message },
                };
            }

            return {
                status: 200,
                data: result.data,
                message: i18n.__("FAQ_LIST_FETCHED_SUCCESSFULLY"),
                error: {},
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
    static async getTermsAndConditions(request) {
        const { headers: { i18n } } = request;

        try {
            const setting = await SettingsService.getSetting("terms_and_conditions");

            if (setting.ERROR) {
                return {
                    status: 404,
                    data: [],
                    error: { message: i18n.__("SETTING_NOT_FOUND"), reason: setting.message },
                };
            }

            return {
                status: 200,
                data: setting.data,
                message: i18n.__("TERMS_AND_CONDITIONS_FETCHED_SUCCESSFULLY"),
                error: {},
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
    static async getPrivacyPolicy(request) {
        const { headers: { i18n } } = request;
        try {
            const setting = await SettingsService.getSetting("privacy_policy");

            if (setting.ERROR) {
                return {
                    status: 404,
                    data: [],
                    error: { message: i18n.__("SETTING_NOT_FOUND"), reason: setting.message },
                };
            }

            return {
                status: 200,
                data: setting.data,
                message: i18n.__("PRIVACY_POLICY_FETCHED_SUCCESSFULLY"),
                error: {},
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