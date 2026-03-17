import db from "../databases/models/index.js";
import "../config/environment.js";
import { profileEditValidator } from "../validators/profileedit.validator.js";
import { upload } from "./uploadProfileImage.controller.js";
import { hashStr, compareHashedStr } from "../libraries/auth.js";
import { updatepinValidator } from "../validators/updatepin.validator.js";
import { verifyPinValidator } from "../validators/verifiy.validator.js";
import * as Sentry from "@sentry/node";
import UserService from "../services/user.service.js";
import PushNotificationService from "../services/pushNotification.service.js";
import NotificationService from "../services/notification.service.js";
import WhitelistMobilesService from "../services/whitelistMobiles.service.js";
import userSettingsService from "../services/userSettings.service.js";
import ContactListService from "../services/contactList.service.js";

const { User, Op, UserKyc, UserWallet, UserFcm, UserCard, WalletPelePayment, WalletTransaction, ApiLogs, Transfer, TransferRequests, UserSettings, Notification  } = db;

export default class ProfileController {
  /**
   * Get user profile details
   */
  static async getProfileDetails(request) {
    const {
      headers: { i18n },
      user,
    } = request;

    try {
      const userDetails = await UserService.getUserDetails(user.id);

      if (userDetails?.avatar) {
        userDetails.avatar = `${process.env.BASE_URL}/${userDetails.avatar}`;
      }

      return {
        status: 200,
        data: userDetails,
        message: "",
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const updatedData = {
        name: payload.name,
        email: payload.email,
        address: payload.address,
        dob: payload.dob,
        language: payload.language,
      };

      const [validationError, validatedData] = await profileEditValidator(
        updatedData,
        i18n
      );
      if (validationError) return validationError;

      const userDetails = await User.findOne({ where: { id: user.id } });

      if (!userDetails) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("USER_NOT_FOUND", { id: user.id }) },
        };
      }

      await userDetails.update(validatedData);

      return {
        status: 200,
        data: validatedData,
        message: i18n.__("PROFILE_UPDATED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  /**
   * Update user profile avatar
   */
  static async updateProfileAvatar(request) {
    const {
      headers: { i18n },
      user,
    } = request;

    try {
      if (!request.file) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("NO_FILE_UPLOADED") },
        };
      }

      const userDetails = await User.findOne({ where: { id: user.id } });

      if (!userDetails) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("USER_NOT_FOUND", { id: user.id }) },
        };
      }

      await userDetails.update({ avatar: `uploads/${request.file.filename}` });

      return {
        status: 200,
        message: i18n.__("IMAGE_UPLOADED_SUCCESSFULLY"),
        filename: request.file.filename,
        path: `${process.env.BASE_URL}/uploads/${request.file.filename}`,
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  /**
   * Update user PIN
   */
  static async updatePin(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const updatedData = {
        pinCode: payload.pinCode,
        existingPinCode: payload.existingPinCode,
      };

      const [validationError, validatedData] = await updatepinValidator(
        updatedData,
        i18n
      );
      if (validationError) return validationError;

      const userDetails = await User.findOne({ where: { id: user.id } });

      if (!userDetails) {
        return {
          status: 404,
          data: [],
          error: {
            message: i18n.__("USER_NOT_FOUND_WITH_ID", { id: user.id }),
          },
        };
      }

      const isPinCodeValid = await compareHashedStr(
        validatedData?.existingPinCode,
        userDetails?.password
      );

      if (!isPinCodeValid) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("EXISTING_PIN_CODE_INVALID") },
        };
      }

      await userDetails.update({
        password: await hashStr(validatedData?.pinCode),
      });

      return {
        status: 200,
        data: validatedData,
        message: i18n.__("PIN_UPDATED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  static async verifyPin(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const [validationError, validatedData] = await verifyPinValidator(
        {
          pinCode: payload.pinCode,
        },
        i18n
      );
      if (validationError) return validationError;

      const userDetails = await User.findOne({ where: { id: user.id } });

      if (!userDetails) {
        return {
          status: 404,
          data: [],
          error: {
            message: i18n.__("USER_NOT_FOUND_WITH_ID", { id: user.id }),
          },
        };
      }

      const isPinCodeValid = await compareHashedStr(
        validatedData?.pinCode,
        userDetails?.password
      );

      if (!isPinCodeValid) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("PIN_CODE_INVALID") },
        };
      }

      return {
        status: 200,
        data: validatedData,
        message: i18n.__("PIN_VERIFIED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  /**
   * Remove user account
   */
  static async removeAccount(request) {
    const {
      headers: { i18n },
      user,
    } = request;

    try {
      const userDetails = await UserService.getUserDetails(user.id) ;

      if (!userDetails) {
        return {
          status: 404,
          data: [],
          error: {
            message: i18n.__("USER_NOT_FOUND_WITH_ID", { id: user.id }),
          },
        };
      }

      const wallets  = userDetails?.wallets?.find(wallet => parseFloat(wallet.balance) > 0);
      if(wallets){
          return {
            status: 400,
            data: [],
            error: { message: i18n.__("USER_HAS_NON_ZERO_WALLET_BALANCE") },
          };      
      }

      // Remove related data before deleting user
      await Promise.all([
        UserCard.destroy({ where: { userId: user.id } }),
        WalletPelePayment.destroy({ where: { userId: user.id } }),
        WalletTransaction.destroy({ where: { userId: user.id } }),
        UserWallet.destroy({ where: { userId: user.id } }),
        ApiLogs.destroy({ where: { userId: user.id } }),
        UserKyc.destroy({ where: { userId: user.id } }),
        UserFcm.destroy({ where: { userId: user.id } }),
        Transfer.destroy({ where: { senderId: user.id } }),
        Transfer.destroy({ where: { receiverId: user.id } }),
        TransferRequests.destroy({ where: { senderId: user.id } }),
        TransferRequests.destroy({ where: { receiverId: user.id } }),
        UserSettings.destroy({ where: { userId: user.id } }),
        Notification.destroy({ where: { userId: user.id } }),
      ]);
      await User.destroy({ where: { id: user.id } });
     
      return {
        status: 200,
        data: [],
        message: i18n.__("ACCOUNT_REMOVED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  static async saveFcmToken(request) {
    const {
      payload,
      headers: { i18n , deviceid},
      user,
    } = request;

    try {
      const fcmToken = payload.fcmToken;

      if (!fcmToken) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("FCM_TOKEN_REQUIRED") },
        };
      }

      let userFcm = await UserFcm.findOne({ where: { userId: user.id , deviceID: deviceid } });

      if (!userFcm) {
        userFcm = await UserFcm.create({ userId: user.id, fcmToken, deviceID: deviceid });
      } else {
        await userFcm.update({ fcmToken });
      }

      return {
        status: 200,
        data: { fcmToken: userFcm.fcmToken },
        message: i18n.__("FCM_TOKEN_SAVED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async sendPushNotification(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    return new Promise((resolve) => {
      const title = payload?.title || "Hi from Travel Wallet";
      const body =
        payload?.body ||
        "Dummy push notification for testing purposes.Ignore it.";
      PushNotificationService.sendNotification(
        { userId: user.id, title, body, data: { action: "testing_message" } },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message),
                reason: i18n.__("PUSH_NOTIFICATION_ERROR"),
              },
            });
          }

          return resolve({
            status: 200,
            data: response,
            message: i18n.__("PUSH_NOTIFICATION_SUCCESS"),
            error: {},
          });
        }
      );
    });
  }

  static async getUserNotifications(request) {
    const {
      headers: { i18n },
      payload,
      user,
    } = request;

    try {
      const [notifications, totalCount] = await Promise.all([
        NotificationService.getNotifications(
          user.id,
          payload?.page || 1,
          payload?.limit || 10
        ),
        NotificationService.countUnreadNotifications(user.id),
      ]);

      return {
        status: 200,
        data: {
          notifications,
          totalCount,
        },
        message: i18n.__("USER_NOTIFICATIONS_FETCHED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async markNotificationAsRead(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const notificationId = payload.notificationId;

      if (!notificationId) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("NOTIFICATION_ID_REQUIRED") },
        };
      }

      const notification = await NotificationService.markAsRead(
        user.id,
        notificationId
      );

      if (!notification) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("NOTIFICATION_NOT_FOUND") },
        };
      }

      return {
        status: 200,
        data: notification,
        message: i18n.__("NOTIFICATION_MARKED_AS_READ"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async markAllNotificationsAsRead(request) {
    const {
      headers: { i18n },
      user,
    } = request;

    try {
      const updatedCount = await NotificationService.markAllAsReads(user.id);

      if (updatedCount === 0) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("NO_UNREAD_NOTIFICATIONS_FOUND") },
        };
      }

      return {
        status: 200,
        data: { updatedCount },
        message: i18n.__("ALL_NOTIFICATIONS_MARKED_AS_READ"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getLastUnreadNotification(request) {
    const {
      headers: { i18n },
      user,
    } = request;

    try {
      const lastNotification =
        await NotificationService.getLastUnreadNotification(user.id);

      if (!lastNotification) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("NO_NOTIFICATIONS_FOUND") },
        };
      }

      return {
        status: 200,
        data: lastNotification,
        message: i18n.__("LAST_NOTIFICATION_FETCHED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getUnreadNotificationsCount(request) {
    const {
      headers: { i18n },
      user,
    } = request;

    try {
      const unreadCount = await NotificationService.countUnreadNotifications(
        user.id
      );

      return {
        status: 200,
        data: { unreadCount },
        message: i18n.__("UNREAD_NOTIFICATIONS_COUNT_FETCHED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getNotificationBellIconColor(request){
    const {
      headers: { i18n },
      user,
    } = request;

    try {
      const color = await NotificationService.getNotificationBellIconColor(user.id);

      return {
        status: 200,
        data: { color },
        message: i18n.__("NOTIFICATION_BELL_ICON_COLOR_FETCHED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getLastPendingTransferNotification(request) {
    const {
      headers: { i18n },
      user,
    } = request;

    try {
      const lastNotification =
        await NotificationService.getLastPendingTransferNotification(user.id);
      if (!lastNotification) {
        return {
          status: 404,
          data: [],
          error: {
            message: i18n.__("NO_PENDING_TRANSFER_NOTIFICATIONS_FOUND"),
          },
        };
      }

      return {
        status: 200,
        data: lastNotification,
        message: i18n.__(
          "LAST_PENDING_TRANSFER_NOTIFICATION_FETCHED_SUCCESSFULLY"
        ),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async addMobileNumberToContactList(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    return new Promise((resolve) => {
      ContactListService.addMobileNumbers(user.id, payload, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: i18n.__(
                err.message || "FAILED_TO_ADD_MOBILE_NUMBERS_TO_CONTACT_LIST"
              ),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: i18n.__("MOBILE_NUMBERS_ADDED_SUCCESSFULLY_TO_CONTACT_LIST"),
          error: null,
        });
      });
    });
  }
  static async clearContactList(request) {
    const {
      headers: { i18n },
      user,
    } = request;

    const type = request?.payload?.type || 'all'; // all or whitelist

    return new Promise((resolve) => {
      ContactListService.clearContactList(user.id, type, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: i18n.__(
                err.message || "FAILED_TO_CLEAR_CONTACT_LIST"
              ),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: i18n.__("CONTACT_LIST_CLEARED_SUCCESSFULLY"),
          error: null,
        });
      });
    });
  }
  static async addMobileNumberToWhiteList(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    // console.log(payload);
    return new Promise((resolve) => {
      WhitelistMobilesService.create(
        { userId: user.id, ...payload }, 
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "FAILED_TO_ADD_MOBILE_NUMBER_TO_WHITELIST"
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("MOBILE_NUMBER_ADDED_SUCCESSFULLY_TO_WHITELIST"),
            error: null,
          });
        }
      );
    });
  }
  static async getMobileNumberWhiteList(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    return new Promise((resolve) => {
      WhitelistMobilesService.findAll(
        { userId: user.id, type: payload.type ?? "" },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "FAILED_TO_FETCH_MOBILE_NUMBER_WHITELIST"
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("MOBILE_NUMBER_WHITELIST_FETCHED_SUCCESSFULLY"),
            error: null,
          });
        }
      );
    });
  }

  static async deleteMobileNumberFromWhiteList(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    return new Promise((resolve) => {
      WhitelistMobilesService.destroy(
        {
          where: { userId: user.id, id: payload.id },
        },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  "FAILED_TO_DELETE_MOBILE_NUMBER_FROM_WHITELIST"
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response,
            message: i18n.__(
              "MOBILE_NUMBER_DELETED_SUCCESSFULLY_FROM_WHITELIST"
            ),
            error: null,
          });
        }
      );
    });
  }
  static async setRequestMoneyRestriction(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    return new Promise((resolve) => {
      if(!['everyone', 'noone', 'contactonly','whitelist'].includes(payload?.restriction)){
        return resolve({
          status: 400,
          data: null,
          error: {
            message: i18n.__("INVALID_REQUEST_MONEY_RESTRICTION"),
            reason: "INVALID_REQUEST_MONEY_RESTRICTION",
          },
        });
      }
      userSettingsService.updateSettings(
        "request_contact_restriction",
        payload.restriction,
        user.id,
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "FAILED_TO_SET_REQUEST_MONEY_RESTRICTION"
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("REQUEST_MONEY_RESTRICTION_SET_SUCCESSFULLY"),
            error: null,
          });
        }
      );
    });
  }
  static async setSendMoneyRestriction(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    return new Promise((resolve) => {
      
      if(!['everyone', 'noone', 'contactonly','whitelist'].includes(payload?.restriction)){
        return resolve({
          status: 400,
          data: null,
          error: {
            message: i18n.__("INVALID_SEND_MONEY_RESTRICTION"),
            reason: "INVALID_SEND_MONEY_RESTRICTION",
          },
        });
      }
      userSettingsService.updateSettings(
        "send_money_restriction",
        payload.restriction,
        user.id,
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "FAILED_TO_SET_SEND_MONEY_RESTRICTION"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("SEND_MONEY_RESTRICTION_SET_SUCCESSFULLY"),
            error: null,
          });
        }
      );
    });
  }

  static async checkMobileNumberInContactList(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    return new Promise((resolve) => {
      ContactListService.checkMobileNumberInContactList(
        user.id,
        payload,
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "FAILED_TO_CHECK_MOBILE_NUMBER_IN_CONTACT_LIST"
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("MOBILE_NUMBER_CHECKED_SUCCESSFULLY"),
            error: null,
          });
        }
      );
    });
  }

  static async removeMobileNumberFromContactList(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    return new Promise((resolve) => {
      ContactListService.removeMobileNumberFromContactList(
        user.id,
        payload,
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "FAILED_TO_REMOVE_MOBILE_NUMBER_FROM_CONTACT_LIST"
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("MOBILE_NUMBER_REMOVED_SUCCESSFULLY_FROM_CONTACT_LIST"),
            error: null,
          });
        }
      );
    });
     
  }
 
  static async clearDeviceId(request) {
    const {
      headers: { i18n, deviceid },
      user,
      payload,
    } = request;

    return new Promise((resolve) => {
      UserService.clearDeviceId(user.id, deviceid, false, i18n, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: i18n.__(
                err.message || "FAILED_TO_CLEAR_DEVICE_ID"
              ),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: i18n.__("DEVICE_ID_CLEARED_SUCCESSFULLY"),
          error: null,
        });
      });
    });
  }
  static async deleteDeviceId(request) {
    const {
      headers: { i18n, deviceid },
      user,
      payload,
    } = request;

    if(deviceid === payload?.deviceId){
      return {
            status: 400,
            data: null,
            error: {
              message: i18n.__(
                "CANNOT_DELETE_CURRENTLY_USED_DEVICE_ID"
              ),
              reason: "CANNOT_DELETE_CURRENTLY_USED_DEVICE_ID",
            },
          }
    }

    return new Promise((resolve) => {
      UserService.clearDeviceId(user.id, payload.deviceId, true, i18n, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: i18n.__(
                err.message || "FAILED_TO_DELETE_DEVICE_ID"
              ),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: i18n.__("DEVICE_ID_DELETED_SUCCESSFULLY"),
          error: null,
        });
      });
    });
  }
}
