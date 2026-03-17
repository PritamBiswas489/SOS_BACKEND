import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import KycService from "./kyc.service.js";
import { hashStr, compareHashedStr, generateToken } from "../libraries/auth.js";
import PushNotificationService from "./pushNotification.service.js";
import moment from "moment-timezone";

const { Op, User, UserKyc, UserWallet, UserDevices, UserFcm, UserSettings } = db;

export default class UserService {
  static async getUserById(userId) {
    try {
      const user = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ["password", "createdAt", "updatedAt"] },
      });
      return user;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  static async createSiteApplicant({ id, userId }) {
    try {
      const newSiteApplicant = await UserKyc.create({
        uuid: id,
        userId,
      });
      return newSiteApplicant;
    } catch (error) {
      console.error("Error creating site applicant:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  static async updateKycData({ applicantid, id }) {
    try {
      const updatedKyc = await UserKyc.update(
        { applicantId: applicantid },
        { where: { id } }
      );
      return updatedKyc;
    } catch (error) {
      console.error("Error updating KYC data:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  static async getUserKycData(userId) {
    try {
      const userKyc = await UserKyc.findOne({
        where: { userId },
      });
      return userKyc;
    } catch (error) {
      console.error("Error fetching user KYC data:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
   
  static async updateKycStatus({ applicantid, status }) {
    try {
      const updatedKyc = await UserKyc.update(
        { status },
        { where: { applicantId: applicantid } }
      );
      return updatedKyc;
    } catch (error) {
      console.error("Error updating KYC status:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  static async deleteUserKycData(userId) {
    try {
      const userKyc = await UserKyc.findOne({
        where: { userId },
      });
      if (!userKyc) {
        // No KYC data found for this user
        return 0;
      }
      const applicantId = userKyc.applicantId;
      const deletedKyc = await UserKyc.destroy({
        where: { userId },
      });
      if (applicantId) {
        await KycService.deleteWebHookStatus(applicantId);
      }
      return deletedKyc;
    } catch (error) {
      console.error("Error deleting user KYC data:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }

  static async clearDeviceId(userId, deviceid, sendNotification, i18n, callback) {
    try {
      const userdevice = await UserDevices.findOne({ where: { userId: userId, deviceID: deviceid } });
      const userFcm = await UserFcm.findOne({ where: { userId: userId, deviceID: deviceid } });
      let fcmToken = "";
      let deviceName = '';
      if(userFcm){
        fcmToken = userFcm.fcmToken;
      }
      if(userdevice){
        deviceName = userdevice.deviceName;
      }
      
      if (!userdevice) {
        return callback("User not found", null);
      }
      await userdevice.destroy();
      if(userFcm){
        await userFcm.destroy();
      }
      const allDevice = await UserDevices.findAll({ where: { userId: userId } });
      if(sendNotification && fcmToken){
        console.log("Sending device logged out notification to FCM token:", fcmToken);
        PushNotificationService.sendNotificationByFcmToken(
          {
            fcmToken: fcmToken,
            title: i18n.__("DEVICE_LOGGED_OUT",{ deviceName: deviceName || deviceid  }),
            body: i18n.__("YOUR_DEVICE_HAS_BEEN_LOGGED_OUT",{ deviceName: deviceName || deviceid }),
            data: {
              deviceId: deviceid,
              action: "DEVICE_LOGGED_OUT",
            },
          },
          () => {
            // Notification result ignored intentionally
          }
        );
      }
      return callback(null, { data:  allDevice });
    } catch (error) {
      console.error("Error clearing device ID:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback("Error clearing device ID", null);
    }
  }
  static async getUserDetails(userId) {
    try {
      const user = await User.findOne({
        where: { id: userId },
        attributes: [
          "id",
          "name",
          "email",
          "phoneNumber",
          "role",
          "avatar",
          "dob",
          "address",
          "language",
          "hexSalt",
          "logged_device_id",
        ],
        include: [
          {
            model: UserDevices,
            as: "devices",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: UserKyc,
            as: "kyc",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: UserWallet,
            as: "wallets",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: UserFcm,
            as: "fcm",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: UserSettings,
            as: "settings",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
        ],
      });
    if (user && user.devices && Array.isArray(user.devices)) {
        const plainUser = typeof user.toJSON === "function" ? user.toJSON() : user;
        const devicesArray = Array.isArray(plainUser.devices)
          ? plainUser.devices.map((d) => (typeof d.toJSON === "function" ? d.toJSON() : d))
          : [];

        plainUser.devices = devicesArray.map((device) => {
          if (device.firstLoggedIn)
            device.firstLoggedIn = moment
              .utc(device.firstLoggedIn)
              .tz(process.env.TIMEZONE)
              .format("YYYY-MM-DD HH:mm:ss");
          if (device.lastLoggedIn)
            device.lastLoggedIn = moment
              .utc(device.lastLoggedIn)
              .tz(process.env.TIMEZONE)
              .format("YYYY-MM-DD HH:mm:ss");
          return device;
      });
      return plainUser;
    }

    return user;
    } catch (error) {
      console.error("Error fetching user details:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  static async checkDeviceIdExistance(userId, deviceID) {
    try {
      const user = await UserDevices.findOne({ where: { userId,  deviceID } });
      return !!user;
    } catch (error) {
      console.error("Error checking device ID existence:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    } 
  }
  static async createDefaultAdminUser() {

    try{
      const user = await User.findOne({
        where: { role: "ADMIN" },
      });
      if (user) {
        console.log("Admin user already exists.");
        return;
      }
      const adminUser = {
        name: "Admin User",
        email: "admin@travelmoney.co.il",
        phoneNumber: "1111111111",
        password: await hashStr("admin@travelmoney.co.il"),
        role: "ADMIN",
        status: "active",
      };
      await User.create(adminUser);
      console.log("Default admin user created successfully.");
    }catch (error) {
      console.error("Error creating default admin user:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
}

