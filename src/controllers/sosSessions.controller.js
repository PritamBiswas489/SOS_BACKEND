import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import SosSessionsService from "../services/sosSessions.service.js";

export default class SosSessionsController {
  static async registerSosSession(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;

    return new Promise((resolve) => {
      SosSessionsService.registerSosSession(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "SEND_INVITATION_FAILED",
                ),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("SEND_INVITATION_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
}
