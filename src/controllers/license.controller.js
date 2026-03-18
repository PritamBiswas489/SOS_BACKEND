import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import LicenseService from "../services/license.service.js";

export default class LicenseController {
  static async generateLicenseCode(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      LicenseService.generateLicenseCode(
        { userId: userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GENERATE_LICENSE_CODE_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("GENERATE_LICENSE_CODE_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async getLicenseCode(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;

    return new Promise((resolve) => {
      LicenseService.getLicenseCode(
        { userId: userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_LICENSE_CODE_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("GET_LICENSE_CODE_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  
}
