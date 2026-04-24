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
  static async sendSosSessionNotification(request) {
       const { payload, headers, user } = request;
       return new Promise((resolve) => {
         SosSessionsService.sendSosSessionNotification(
           { payload, headers, user },
            (err, response) => {
              if (err) {
                return resolve({
                  status: 400,
                  data: null,
                  error: {
                    message: headers?.i18n.__(
                      err.message || "SEND_SOS_SESSION_NOTIFICATION_FAILED",
                    ),
                    reason: err.message,
                  },
                });
              }
              return resolve({
                status: 200,
                data: response.data,
                message: headers?.i18n.__("SEND_SOS_SESSION_NOTIFICATION_SUCCESSFUL"),
                error: null,
              });
            }
          );
        });
  }
  // This method will handle incoming notifications related to SOS sessions, such as updates on the session status or responses from emergency contacts.
  static async incommingSosSessionNotification(request) {
    const { payload, headers, user } = request;
    return new Promise((resolve) => {
      SosSessionsService.incommingSosSessionNotification(
        { payload, headers, user },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "INCOMMING_SOS_SESSION_NOTIFICATION_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("INCOMMING_SOS_SESSION_NOTIFICATION_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async mySosSessions(request) {
    const { payload, headers, user } = request;
    return new Promise((resolve) => {
      SosSessionsService.mySosSessions(
        { payload, headers, user },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "MY_SOS_SESSIONS_RETRIEVAL_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("MY_SOS_SESSIONS_RETRIEVAL_SUCCESSFUL"),
            error: null,
          });
        }
      );

    });
  }
  static async responseSosSessionNotification(request) {
    const { payload, headers, user } = request;
    return new Promise((resolve) => {
      SosSessionsService.responseSosSessionNotification(
        { payload, headers, user },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "RESPONSE_SOS_SESSION_NOTIFICATION_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("RESPONSE_SOS_SESSION_NOTIFICATION_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async changeMySosSessionStatus(request) {
    const { payload, headers, user } = request;
    return new Promise((resolve) => {
      SosSessionsService.changeMySosSessionStatus(
        { payload, headers, user },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "CHANGE_SOS_SESSION_STATUS_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("CHANGE_SOS_SESSION_STATUS_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async saveSessionAudioFileName(request) {
    const { payload, headers, user } = request;
    return new Promise((resolve) => {
      SosSessionsService.saveSessionAudioFileName(
        { session_id: payload.session_id, file_name: payload.file_name }, 
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "SAVE_SESSION_AUDIO_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("SAVE_SESSION_AUDIO_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
}
