import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import CrashReportService from "../services/crashReport.service.js";
export default class CrashReportController {
  static async submitCrashReport(request) {
    const { payload, headers } = request;
    console.log(
      "Received crash report submission request with payload:",
      payload,
    );
    return new Promise((resolve) => {
      CrashReportService.submitCrashReport(
        { payload, headers },
        (err, response) => {
          if (err) {
            console.error("Error in submitCrashReport:", err);
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "CRASH_REPORT_SUBMISSION_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("CRASH_REPORT_SUBMITTED_SUCCESSFULLY"),
            error: null,
          });
        },
      );
    });
  }
  static async getCrashReports(request) {
    const { payload, headers } = request;
    console.log(
      "Received request to fetch crash reports with payload:",
      payload,
    );
    return new Promise((resolve) => {
      CrashReportService.getCrashReports(
        { payload, headers },
        (err, response) => {
          if (err) {
            console.error("Error in getCrashReports:", err);
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "CRASH_REPORT_FETCH_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.crashReports,
            message: headers?.i18n.__("CRASH_REPORTS_FETCHED_SUCCESSFULLY"),
            error: null,
          });
        },
      );
    });
  }
}
