import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";

const { Op, HeartRateRecords } = db;

export default class HeartRateService {
  static async saveStressReading({ userid, payload, headers }, callback) {
    try {
      const {
        source,
        current_hr,
        created_at,
        stress_score,
        stress_state,
        stress_level,
        rmssd,
        hr_intensity,
        hr_score,
        rmssd_score,
        avg_hr,
      } = payload;

      const record = await HeartRateRecords.create({
        user_id: userid,
        source,
        current_hr,
        created_at: created_at ? new Date(created_at) : new Date(),
        stress_score: stress_score ?? null,
        stress_state: stress_state ?? null,
        stress_level: stress_level ?? null,
        rmssd: rmssd ?? null,
        hr_intensity: hr_intensity ?? null,
        hr_score: hr_score ?? null,
        rmssd_score: rmssd_score ?? null,
        avg_hr: avg_hr ?? null,
      });

      return callback(null, { data: record });
    } catch (error) {
      console.log("ERROR In saveStressReading", error?.message || error);
      logger.error("ERROR In saveStressReading", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("SAVE_STRESS_READING_FAILED"), null);
    }
  }

  static async getStressReadings({ userid, payload, headers }, callback) {
    try {
      const limit = payload.limit ? parseInt(payload.limit) : 20;
      const page = payload.page ? parseInt(payload.page) : 1;
      const offset = (page - 1) * limit;

      const { count, rows } = await HeartRateRecords.findAndCountAll({
        where: {
          user_id: userid,
          deleted_at: null,
        },
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      return callback(null, {
        data: rows,
        total: count,
        page,
        limit,
      });
    } catch (error) {
      logger.error("ERROR In getStressReadings", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_STRESS_READINGS_FAILED"), null);
    }
  }

  static async getLatestStressReading({ userid, payload, headers }, callback) {
    try {
      const record = await HeartRateRecords.findOne({
        where: {
          user_id: userid,
          deleted_at: null,
        },
        order: [["created_at", "DESC"]],
      });

      return callback(null, { data: record });
    } catch (error) {
      logger.error("ERROR In getLatestStressReading", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_LATEST_STRESS_READING_FAILED"), null);
    }
  }
  static async getContactLatestStressReading(contactIds, callback) {
    try {
        console.log("Fetching latest stress readings for contact IDs:", contactIds);
      const heartRateData = [];
        for (const contactId of contactIds) {
            const record = await HeartRateRecords.findOne({
                where: {
                    user_id: contactId,
                    deleted_at: null,
                },
                order: [["created_at", "DESC"]],
            });
            if (record) {
                heartRateData.push(record);
            }
        }
        return callback(null, { data: heartRateData });
    } catch (error) {
        console.log("ERROR In getContactLatestStressReading", error?.message || error);
      logger.error("ERROR In getContactLatestStressReading", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_CONTACT_LATEST_STRESS_READING_FAILED"), null);
    }
  }
}
