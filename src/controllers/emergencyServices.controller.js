import "../config/environment.js";
import Joi from "joi";
import EmergencyServicesService from "../services/emergencyServices.service.js";

export default class EmergencyServicesController {
    static async requestRegisterNewEmergencyService(request) {
        const { payload, headers, user } = request;
        const userid = user?.id;
        return new Promise((resolve) => {
            EmergencyServicesService.requestRegisterNewEmergencyService(
                { payload, userid },
                (err, response) => {
                    if (err) {
                        return resolve({
                            status: 400,
                            data: null,
                            error: {
                                message: headers?.i18n.__(
                                    err.message || "REQUEST_REGISTER_NEW_EMERGENCY_SERVICE_FAILED",
                                ),
                                reason: err.message,
                            },
                        });
                    }
                    return resolve({
                        status: 200,
                        data: response.data,
                        message: headers?.i18n.__("REQUEST_REGISTER_NEW_EMERGENCY_SERVICE_SUCCESSFUL"),
                        error: null,
                    });
                },

            );
        });
    }
    static async getNearbyEmergencyServices(request) {
        const { payload, headers, user } = request;
        return new Promise((resolve) => {
            EmergencyServicesService.getNearbyEmergencyServices(
                { payload },
                (err, response) => {
                    if (err) {
                        return resolve({
                            status: 400,
                            data: null,
                            error: {
                                message: headers?.i18n.__(
                                    err.message || "GET_NEARBY_EMERGENCY_SERVICES_FAILED",
                                ),
                                reason: err.message,
                            },
                        });
                    }
                    return resolve({
                        status: 200,
                        data: response.data,
                        message: headers?.i18n.__("GET_NEARBY_EMERGENCY_SERVICES_SUCCESSFUL"),
                        error: null,
                    });
                }
            );
        });


    }
    static async getMyRequestedEmergencyServices(request) {
        const { payload, headers, user } = request;
        const userid = user?.id;
        console.log("userid", userid);
        return new Promise((resolve) => {
            EmergencyServicesService.getMyRequestedEmergencyServices(
                { payload, userid },
                (err, response) => {
                    if (err) {
                        return resolve({
                            status: 400,
                            data: null,
                            error: {
                                message: headers?.i18n.__(
                                    err.message || "GET_MY_REQUESTED_EMERGENCY_SERVICES_FAILED",
                                ),
                                reason: err.message,
                            },
                        });
                    }
                    return resolve({
                        status: 200,
                        data: response.data,
                        message: headers?.i18n.__("GET_MY_REQUESTED_EMERGENCY_SERVICES_SUCCESSFUL"),
                        error: null,
                    });
                }
            );
        });
    }

    static async deleteEmergencyServiceLocation(request) {
        const { payload, headers, user } = request;
        const userid = user?.id;
         

        return new Promise((resolve) => {
            EmergencyServicesService.deleteEmergencyServiceLocation(
                { payload, userid },
                (err, response) => {
                    if (err) {
                        return resolve({
                            status: 400,
                            data: null,
                            error: {
                                message: headers?.i18n.__(
                                    err.message || "DELETE_EMERGENCY_SERVICE_LOCATION_FAILED",
                                ),
                                reason: err.message,
                            },
                        });
                    }
                    return resolve({
                        status: 200,
                        data: response.data,
                        message: headers?.i18n.__("DELETE_EMERGENCY_SERVICE_LOCATION_SUCCESSFUL"),
                        error: null,
                    });
                }
            );
        });
    }

}
