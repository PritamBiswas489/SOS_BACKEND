import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import UserService from "../services/user.service.js";

export default class ProfileController {
  static async getAppUserProfile(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      UserService.getAppUserProfile(userid, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "GET_PROFILE_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response,
          message: headers?.i18n.__("GET_PROFILE_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  static async saveDeviceToken(request) {
        const { payload, headers, user } = request;
        const userid = user?.id;
        const deviceId = request?.headers?.['deviceid'] || null;
        console.log("Device ID from headers:", deviceId);
        payload.device_id = deviceId; // Add device_id to the payload
        return new Promise((resolve) => {
          UserService.saveDeviceToken(
            { userId: userid, payload, headers },
            (err, response) => {              if (err) {
                return resolve({
                  status: 400,
                    data: null,
                    error: {
                      message: headers?.i18n.__(
                        err.message || "SAVE_DEVICE_TOKEN_FAILED",
                        ),
                        reason: err.message,
                    },
                });
              }
                return resolve({
                    status: 200,
                    data: response,
                    message: headers?.i18n.__("SAVE_DEVICE_TOKEN_SUCCESSFUL"),
                    error: null,
                });
            }
            );
        });
        

  }
  static async deleteDeviceToken(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      UserService.deleteDeviceToken(
        { userId: userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "DELETE_DEVICE_TOKEN_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response,
            message: headers?.i18n.__("DELETE_DEVICE_TOKEN_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }

  static async updateProfile(request) {
    const { payload, headers, user, profileImagePath } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      UserService.updateProfile(
        { userId: userid, payload, headers, profileImagePath },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "UPDATE_PROFILE_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response,
            message: headers?.i18n.__("UPDATE_PROFILE_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async  checkDeviceIsEqualToLastLogin(request) {
    const { headers, user } = request;
    const userid = user?.id;
    const deviceId = headers?.['deviceid'] || null;
    try {
      const getDevice = await UserService.getDeviceIdByUserId(userid);
      let isDeviceIdEqual = true;
      console.log("getDevice", getDevice);
      if(getDevice){
        console.log("Device ID from request headers:", deviceId);
        console.log("Last login device ID:", getDevice);
        isDeviceIdEqual = getDevice === deviceId;
      }
      return {
        status: 200,
        data: { isDeviceIdEqual },
        message: headers?.i18n.__("CHECK_DEVICE_ID_SUCCESSFUL"),
        error: null,
      };
    } catch (error) {
      return {
        status: 500,
        data: null,
        error: {
          message: headers?.i18n.__("CHECK_DEVICE_ID_FAILED"),
          reason: error.message,
        },
      };
    }
  }
}