import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import { hashStr, compareHashedStr, generateToken } from "../libraries/auth.js";
import logger from "../config/winston.js";
import moment from "moment-timezone";
import fs from "fs";
import path from "path";
import { getProfileImage } from "../libraries/utility.js";
import { enqueueBulk } from "../queues/notificationQueue.js";
 

const { Op, User, Licenses, Devices } = db;

export default class UserService {
  static async getUserById(userId) {
    try {
      const user = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ["password_hash", "created_at", "updated_at"] },
      });
      return user;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      logger.error("ERROR In getUserById", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  //get app user profile by user id
  static async getAppUserProfile(userId, callback) {
    try {
      const user = await User.findOne({
        where: { id: userId, role: "USER" },
        attributes: { exclude: ["password_hash", "created_at", "updated_at"] },
        include: [
          {
            model: Licenses,
            as: "licenses",
            attributes: ["id", "license_key", "status", "expiry_date"],
          },
          {
            model: Devices,
            as: "devices",
            attributes: [
              "id",
              "device_token",
              "device_type",
              "is_active",
              "last_login",
            ],
          },
        ],
      });
      if (!user) {
        return callback(new Error("USER_NOT_FOUND"), null);
      }
      const userAvatafrUrl = user.profile_photo;
      //check image exists in uploads folder if not set default avatar
      user.profile_photo = getProfileImage(userAvatafrUrl);
      return callback(null, user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      logger.error("ERROR In getAppUserProfile", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(error, null);
    }
  }
  static async getUserDeviceTokens(userId, callback) {
    try {
      const devices = await Devices.findAll({
        where: { user_id: userId },
        attributes: ["device_token", "device_type"],
      });
      const deviceTokens = devices.map((device) => device.device_token);
      return callback(null, deviceTokens);
    } catch (error) {
      console.error("Error fetching user device tokens:", error);
      logger.error("ERROR In getUserDeviceTokens", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(error, null);
    }
  }
  static async saveDeviceToken({ userId, payload, headers }, callback) {
    try {
      console.log("Saving device token for user ID:", userId);
      const { device_token, device_type, device_id } = payload;
      const checkDevice = await Devices.findOne({
        where: { user_id: userId },
      });

      if (checkDevice) {
        await Devices.update(
          {
            device_token,
            device_type,
            device_id,
            last_login: moment().tz(process.env.timezone).format(),
          },
          { where: { user_id: userId } },
        );
      } else {
        await Devices.create({
          user_id: userId,
          device_token,
          device_type,
          device_id,
          last_login: moment().tz(process.env.timezone).format(),
        });
      }
      return callback(null, { message: "Device token saved successfully" });
    } catch (error) {
      console.error("Error saving device token:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      logger.error("ERROR In saveDeviceToken", { error: error });
      return callback(new Error("SAVE_DEVICE_TOKEN_FAILED"), null);
    }
  }
  static async deleteDeviceToken({ userId, payload, headers }, callback) {
    try {
      console.log("Deleting device token for user ID:", userId);
      await Devices.destroy({ where: { user_id: userId } });
      return callback(null, { message: "Device token deleted successfully" });
    } catch (error) {
      console.error("Error deleting device token:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      logger.error("ERROR In deleteDeviceToken", { error: error });
      return callback(new Error("DELETE_DEVICE_TOKEN_FAILED"), null);
    }
  }

  static async updateProfile(
    { userId, payload, headers, profileImagePath },
    callback,
  ) {
    try {
      const user = await User.findOne({
        where: { id: userId, role: "USER" },
      });
      if (!user) {
        return callback(new Error("USER_NOT_FOUND"), null);
      }

      const updateData = {};

      // Update name if provided
      if (payload.name) {
        updateData.name = payload.name;
      }

      // Update email if provided
      if (payload.email) {
        updateData.email = payload.email;
      }

      // Update profile image if provided
      if (profileImagePath) {
        updateData.profile_photo = profileImagePath;
      }

      // Only update if there's data to update
      if (Object.keys(updateData).length === 0) {
        return callback(new Error("NO_UPDATE_DATA_PROVIDED"), null);
      }
      updateData.first_time_login = false; // Set first_time_login to false on profile update

      await User.update(updateData, {
        where: { id: userId },
      });

      const updatedUser = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ["password_hash", "created_at", "updated_at"] },
      });

      return callback(null, updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      logger.error("ERROR In updateProfile", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(error, null);
    }
  }
  static async checkDeviceIdExistance(userId, deviceID) {
    try {
      const exist = await Devices.findOne({
        where: { user_id: userId, device_id: deviceID },
      });
      return !!user; // Return true if device exists, false otherwise
    } catch (error) {
      console.error("Error checking device ID existence:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  static async getDeviceIdByUserId(userId) {
     try{
      const device = await Devices.findOne({
        where: { user_id: userId },
        attributes: ['device_id']
      });
      return device ? device.device_id : null;
     } catch (error) {
       console.error("Error getting device ID by user ID:", error);
       process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
       return null;
     }
  }
  static async checlMultipleDeviceLogin(userId, deviceID, i18n) {
    console.log(
      "Checking multiple device login for user ID:",
      userId,
      "with device ID:",
      deviceID,
    );
    try {
      const checkDevice = await Devices.findOne({
        where: { user_id: userId },
      });
      if (checkDevice && checkDevice.device_id !== deviceID) {
        const previousDeviceToken = checkDevice.device_token;
        if (previousDeviceToken) {
          console.log("User logged in from a different device. Previous device token:", previousDeviceToken);
          await enqueueBulk([previousDeviceToken], {
            title: i18n.__("ACCOUNT_ACCESSED_FROM_NEW_DEVICE"),
            message: i18n.__(
              "YOUR_ACCOUNT_WAS_ACCESSED_FROM_ANOTHER_DEVICE",
            ),
            data: {
              messageType: "ACCOUNT_ACCESSED_FROM_NEW_DEVICE_NOTIFICATION",
            },
          });
        }
      }
    } catch (error) {}
  }
}
