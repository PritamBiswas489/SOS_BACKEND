import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import { hashStr, compareHashedStr, generateToken } from "../libraries/auth.js";
import moment from "moment-timezone";

const { Op, User, UserKyc, UserWallet, UserDevices, UserFcm, UserSettings } = db;

export default class UserService {
  static async getUserById(userId) {
    try {
      const user = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ["password_hash", "createdAt", "updatedAt"] },
      });
      return user;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
}

