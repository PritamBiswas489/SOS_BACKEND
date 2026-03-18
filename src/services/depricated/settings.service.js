import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
const { Setting, Op, User } = db;

export default class SettingsService {
  static async getSettings() {
    try {
      const settings = await Setting.findAll();
      return { SUCCESS: 1, data: settings };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }
  static async updateSettings(key, value) {
    try {
      const setting = await Setting.findOne({
        where: { key: key },
      });
      if (setting) {
        // Update existing setting
        await Setting.update({ value: value }, { where: { key: key } });
      } else {
        // Create new setting
        await Setting.create({ key: key, value: value });
      }
      return { SUCCESS: 1 };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }
  static async getSetting(key) {
    try {
      const setting = await Setting.findOne({ where: { key: key } }); 
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
