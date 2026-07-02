import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import AdminService from "../services/admin.service.js";

export default class RequestIosController {
    static async requestForIosAccess(request) {
        const { payload, headers: { i18n }, user } = request;
        const userId = user?.id;
        return new Promise(async (resolve) => {
            AdminService.requestForIosAccess(
                { userId, payload },
                (err, response) => {
                    if (err) {
                        return resolve({
                            status: 400,
                            data: null,
                            error: {
                                message: i18n.__(
                                    err.message || "REQUEST_IOS_ACCESS_FAILED",
                                ),
                                reason: err.message,
                            },
                        });
                    }
                    return resolve({
                        status: 200,
                        data: response.data,
                        message: i18n.__("REQUEST_IOS_ACCESS_SUCCESSFUL"),
                        error: null,
                    });
                },
            );
        });
    }

    static async getStatusOfIosAccessRequest(request) {
        const { headers: { i18n }, user } = request;
        const userId = user?.id;

        if (!userId) {
            return {
                status: 400,
                data: null,
                error: {
                    message: i18n.__("USER_NOT_FOUND"),
                    reason: "USER_NOT_FOUND",
                },
            };
        }

        return new Promise(async (resolve) => {
            AdminService.getStatusOfIosAccessRequest(
                { userId },
                (err, response) => {
                    if (err) {
                        return resolve({
                            status: 400,
                            data: null,
                            error: {
                                message: i18n.__(
                                    err.message || "GET_STATUS_OF_IOS_ACCESS_REQUEST_FAILED",
                                ),
                                reason: err.message,
                            },
                        });
                    }

                    return resolve({
                        status: 200,
                        data: response.data,
                        message: i18n.__("GET_STATUS_OF_IOS_ACCESS_REQUEST_SUCCESSFUL"),
                        error: null,
                    });
                },
            );
        });
    }
}