import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { CronTrack, Op, User } = db;
export default class CronTrackService {
  static async addCronTrack(cronName) {
    try {
    const lastRunAt = new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
    // Convert to Date object
    const lastRunAtDate = new Date(lastRunAt);
    let cronTrack = await CronTrack.findOne({ where: { cronName } });
    if (cronTrack) {
      await cronTrack.update({ lastRunAt: lastRunAtDate });
    } else {
      cronTrack = await CronTrack.create({ cronName, lastRunAt: lastRunAtDate });
    }
    return { data: cronTrack };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }
  static async listCronTracks() {
    try {
      const cronTracks = await CronTrack.findAll({
        order: [["lastRunAt", "ASC"]],
      });
      return { data: cronTracks };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }
}
