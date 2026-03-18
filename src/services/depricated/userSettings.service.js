import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
const { UserSettings, Op, User } = db;

export default class userSettingsService {
  static async getSettings(userId) {
    try {
      const settings = await UserSettings.findAll({ where: { userId: userId } });
      return { SUCCESS: 1, data: settings };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }
static async updateSettings(key, value, userId, callback) {
  console.log(key, value, userId)
    try {
        const setting = await UserSettings.findOne({
            where: { key: key, userId: userId },
        });
        if (setting) {
            // Update existing setting
            await UserSettings.update({ value: value }, { where: { key: key, userId: userId } });
        } else {
             
            // Create new setting
            await UserSettings.create({ key: key, value: value, userId: userId });
        }
        const result = { SUCCESS: 1 };
        if (typeof callback === "function") {
            callback(null, result);
        }
        return result;
    } catch (e) {
      console.log(e.message);
        process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
        const errorResult = { ERROR: 1 };
        if (typeof callback === "function") {
            callback(new Error("CATCH_ERROR"), errorResult);
        }
        return errorResult;
    }
}
  static async getSetting(key, userId) {
    try {
      const setting = await UserSettings.findOne({ where: { key: key, userId: userId } });
      if (setting) {
        return { SUCCESS: 1, data: setting };
      } else {
            return { ERROR: 1, message: "Setting not found" };
        }
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }

}

}
