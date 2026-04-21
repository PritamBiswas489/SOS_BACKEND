import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
const { Op, User, SosSessions } = db;
export default class SosSessionsService {
  static async registerSosSession({ userid, payload, headers }, callback) {
    try {
      const newSosSession = await SosSessions.create({
        user_id: userid,
      });
      return callback(null, { data: newSosSession });
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In registerSosSession", { error: e });
      console.error("Error creating SOS session:", e.message);
      return callback(new Error("REGISTER_SOS_SESSION_FAILED"), null);
    }
  }
}
