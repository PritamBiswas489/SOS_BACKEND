import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import Joi from "joi";
import NotificationCampaignService from "../services/notificationCampign.service.js";

export default class NotificationCampaignController {

    static async createNotificationCampaign(request) {
        const { payload, headers, user } = request;

        const schema = Joi.object({
            title: Joi.string().trim().required(),
            subject: Joi.string().trim().when("channel", {
                is: Joi.valid("email", "both"),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }),
            bodyText: Joi.string().trim().optional(),
            pushTitle: Joi.string().trim().when("channel", {
                is: Joi.valid("push", "both"),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }),
            pushBody: Joi.string().trim().when("channel", {
                is: Joi.valid("push", "both"),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }),
            targetType: Joi.string().valid("all", "user_type", "specific").required(),
            userTypes: Joi.array().items(Joi.string().valid("ngo", "user")).when("targetType", {
                is: "user_type",
                then: Joi.array().min(1).required(),
                otherwise: Joi.optional(),
            }),
            userIds: Joi.array().items(Joi.number().integer()).when("targetType", {
                is: "specific",
                then: Joi.array().min(1).required(),
                otherwise: Joi.optional(),
            }),
            channel: Joi.string().valid("email", "push", "both").required(),
            scheduledAt: Joi.string().isoDate().allow(null).optional(),
            resolveBatchSize: Joi.number().integer().min(1).default(1000),
        });

        const { error, value } = schema.validate(payload);
        if (error) {
            return {
                status: 400,
                data: null,
                message: headers?.i18n.__(error.details[0].message || "INVALID_INPUT"),
                error: {
                    reason: error.details[0].message,
                },
            };
        }

        return new Promise((resolve) => {
            NotificationCampaignService.createNotificationCampaign({ payload: value, user }, (err, response) => {
                if (err) {
                    return resolve({
                        status: 400,
                        data: null,
                        error: {
                            message: headers?.i18n.__(err.message || "ERROR_OCCURRED_DURING_PROCESSING"),
                            reason: err.message,
                        },
                    });
                }
                return resolve({
                    status: 200,
                    data: response.data,
                    message: headers?.i18n.__("NOTIFICATION_CAMPAIGN_CREATED_SUCCESSFULLY"),
                    error: null,
                });
            });
        });

    }

    static async getNotificationCampaignList(request) {
        const { payload, headers } = request;

        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
        });

        const { error, value } = schema.validate(payload);
        if (error) {
            return {
                status: 400,
                data: null,
                message: headers?.i18n?.__(error.details[0].message || "INVALID_INPUT"),
                error: {
                    reason: error.details[0].message,
                },
            };
        }

        return new Promise((resolve) => {
            NotificationCampaignService.getNotificationCampaignList({ payload: value }, (err, response) => {
                if (err) {
                    return resolve({
                        status: 400,
                        data: null,
                        error: {
                            message: headers?.i18n?.__(err.message || "ERROR_OCCURRED_DURING_PROCESSING"),
                            reason: err.message,
                        },
                    });
                }
                return resolve({
                    status: 200,
                    data: response.data,
                    message: headers?.i18n?.__("NOTIFICATION_CAMPAIGN_LIST_FETCHED_SUCCESSFULLY"),
                    error: null,
                });
            });
        });

    }

    static async cancelNotificationCampaign(request) {
        const { payload, headers } = request;

        const schema = Joi.object({
            id: Joi.number().integer().required(),
        });

        const { error, value } = schema.validate(payload);
        if (error) {
            return {
                status: 400,
                data: null,
                message: headers?.i18n?.__(error.details[0].message || "INVALID_INPUT"),
                error: {
                    reason: error.details[0].message,
                },
            };
        }

        return new Promise((resolve) => {
            NotificationCampaignService.cancelNotificationCampaign({ payload: value }, (err, response) => {
                if (err) {
                    return resolve({
                        status: 400,
                        data: null,
                        error: {
                            message: headers?.i18n?.__(err.message || "ERROR_OCCURRED_DURING_PROCESSING"),
                            reason: err.message,
                        },
                    });
                }
                return resolve({
                    status: 200,
                    data: response.data,
                    message: headers?.i18n?.__("NOTIFICATION_CAMPAIGN_CANCELLED_SUCCESSFULLY"),
                    error: null,
                });
            });
        });

    }

    static async deleteNotificationCampaign(request) {
        const { payload, headers } = request;

        const schema = Joi.object({
            id: Joi.number().integer().required(),
        });

        const { error, value } = schema.validate(payload);
        if (error) {
            return {
                status: 400,
                data: null,
                message: headers?.i18n?.__(error.details[0].message || "INVALID_INPUT"),
                error: {
                    reason: error.details[0].message,
                },
            };
        }

        return new Promise((resolve) => {
            NotificationCampaignService.deleteNotificationCampaign({ payload: value }, (err, response) => {
                if (err) {
                    return resolve({
                        status: 400,
                        data: null,
                        error: {
                            message: headers?.i18n?.__(err.message || "ERROR_OCCURRED_DURING_PROCESSING"),
                            reason: err.message,
                        },
                    });
                }
                return resolve({
                    status: 200,
                    data: response.data,
                    message: headers?.i18n?.__("NOTIFICATION_CAMPAIGN_DELETED_SUCCESSFULLY"),
                    error: null,
                });
            });
        });

    }
}
