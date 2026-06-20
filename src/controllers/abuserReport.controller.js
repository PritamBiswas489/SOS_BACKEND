import "../config/environment.js";
import AbuserReportService from "../services/abuserReport.service.js";

export default class AbuserReportController {
  static async registerNewAbuser(request) {
    const { payload, headers: { i18n } = {}, user } = request;
    const userId = user?.id;

    return new Promise((resolve) => {
      AbuserReportService.registerNewAbuser(
        { userId, payload },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n?.__(err.message || "REGISTER_ABUSER_FAILED") || err.message,
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n?.__("REGISTER_ABUSER_SUCCESSFUL") || "REGISTER_ABUSER_SUCCESSFUL",
            error: null,
          });
        }
      );
    });
  }

  static async registerNewAbuserReport(request) {
    const { payload, headers: { i18n } = {}, user } = request;
    const userId = user?.id;

    return new Promise((resolve) => {
      AbuserReportService.registerNewAbuserReport(
        { userId, payload },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n?.__(err.message || "REGISTER_ABUSER_REPORT_FAILED") || err.message,
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n?.__("REGISTER_ABUSER_REPORT_SUCCESSFUL") || "REGISTER_ABUSER_REPORT_SUCCESSFUL",
            error: null,
          });
        }
      );
    });
  }

  static async registerNewReport(request) {
    return this.registerNewAbuserReport(request);
  }

  static async getMyReports(request) {
    const { payload, headers: { i18n } = {}, user } = request;
    const userId = user?.id;

    return new Promise((resolve) => {
      AbuserReportService.getMyReports(
        { userId, payload },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n?.__(err.message || "GET_ABUSER_REPORTS_FAILED") || err.message,
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n?.__("GET_ABUSER_REPORTS_SUCCESSFUL") || "GET_ABUSER_REPORTS_SUCCESSFUL",
            error: null,
          });
        }
      );
    });
  }
  static async getExistingAbuser(request) {
    const { payload, headers: { i18n } = {}, user } = request;
    const userId = user?.id;

    return new Promise((resolve) => {
      AbuserReportService.getExistingAbuser(
        { userId, payload },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n?.__(err.message || "GET_EXISTING_ABUSER_FAILED") || err.message,
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n?.__("GET_EXISTING_ABUSER_SUCCESSFUL") || "GET_EXISTING_ABUSER_SUCCESSFUL",
            error: null,
          });
        }
      );
    }
    );

  }

  static async deleteReport(request) {
    const { payload, headers: { i18n } = {}, user } = request;
    const userId = user?.id;

    return new Promise((resolve) => {
      AbuserReportService.deleteReport(
        { userId, payload },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n?.__(err.message || "DELETE_REPORT_FAILED") || err.message,
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n?.__("DELETE_REPORT_SUCCESSFUL") || "DELETE_REPORT_SUCCESSFUL",
            error: null,
          });
        }
      );
    });
  }

  static async deleteAbuser(request) {
    const { payload, headers: { i18n } = {}, user } = request;
    const userId = user?.id;

    return new Promise((resolve) => {
      AbuserReportService.deleteAbuser(
        { userId, payload },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n?.__(err.message || "DELETE_ABUSER_FAILED") || err.message,
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n?.__("DELETE_ABUSER_SUCCESSFUL") || "DELETE_ABUSER_SUCCESSFUL",
            error: null,
          });
        }
      );
    });
  }
}
