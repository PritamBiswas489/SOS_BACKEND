import "../config/environment.js";
import HeartRateService from "../services/heartRate.service.js";

export default class HeartRateController {
  static async saveStressReading(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;

    return new Promise((resolve) => {
      HeartRateService.saveStressReading(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "SAVE_STRESS_READING_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("SAVE_STRESS_READING_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }

  static async getStressReadings(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;

    return new Promise((resolve) => {
      HeartRateService.getStressReadings(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_STRESS_READINGS_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            total: response.total,
            page: response.page,
            limit: response.limit,
            message: headers?.i18n.__("GET_STRESS_READINGS_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }

  static async getLatestStressReading(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;

    return new Promise((resolve) => {
      HeartRateService.getLatestStressReading(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_LATEST_STRESS_READING_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("GET_LATEST_STRESS_READING_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
}
