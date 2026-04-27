import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
const { CrashReports, User } = db;

export default class CrashReportService {
  static async submitCrashReport({ payload, headers }, callback) {
    console.log("Submitting crash report with payload:", payload);
    try {
      const newCrashReport = await CrashReports.create({
        error_payload: payload,
      });
      console.log(
        "Crash report saved successfully with ID:",
        newCrashReport.id,
      );
      return callback(null, { data: newCrashReport, message: "CRASH_REPORT_SUBMITTED_SUCCESSFULLY" });
    } catch (error) {
      logger.error("ERROR In submitCrashReport", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("CRASH_REPORT_SUBMISSION_FAILED"), null);
    }
  }
  static async getCrashReports({ payload, headers }, callback) {
     try{
        const limit = payload.limit ? parseInt(payload.limit) : 10;
        const page = payload.page ? parseInt(payload.page) : 1;
        const offset = (page - 1) * limit;
        const crashReports = await CrashReports.findAll({
            limit : limit,
            offset : offset,
            order: [['created_at', 'DESC']],
        });
        return callback(null, { crashReports });
     } catch (error) {
        logger.error("ERROR In getCrashReports", { error: error });
        process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
        return callback(new Error("CRASH_REPORT_FETCH_FAILED"), null);
     }
  }
}
