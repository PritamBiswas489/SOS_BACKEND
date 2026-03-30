import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import UserService from "../services/user.service.js";

export default class ProfileController {
  static async getAppUserProfile(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      UserService.getAppUserProfile(userid, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "GET_PROFILE_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response,
          message: headers?.i18n.__("GET_PROFILE_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  static async saveDeviceToken(request) {
        const { payload, headers, user } = request;
        const userid = user?.id;
        return new Promise((resolve) => {
          UserService.saveDeviceToken(
            { userId: userid, payload, headers },
            (err, response) => {              if (err) {
                return resolve({
                  status: 400,
                    data: null,
                    error: {
                      message: headers?.i18n.__(
                        err.message || "SAVE_DEVICE_TOKEN_FAILED",
                        ),
                        reason: err.message,
                    },
                });
              }
                return resolve({
                    status: 200,
                    data: response,
                    message: headers?.i18n.__("SAVE_DEVICE_TOKEN_SUCCESSFUL"),
                    error: null,
                });
            }
            );
        });
        

  }
}