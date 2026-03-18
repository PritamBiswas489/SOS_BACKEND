import db from "../databases/models/index.js";

import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { Op, User, UserContactList } = db;
import { handleCallback } from "../libraries/utility.js";
import { createHmacExecute, randomSaltHex } from "../libraries/utility.js";
import { parseSmartPhoneNumber, formatPhoneNumber } from "../libraries/utility.js";

export default class ContactListService {
  static async addMobileNumbers(userId, data, callback) {
    try {
      if (!data?.mobileNumbers || data.mobileNumbers.length === 0) {
        return handleCallback(
          new Error("MOBILE_NUMBERS_REQUIRED"),
          null,
          callback
        );
      }
      if (!["send", "request"].includes(data?.type)) {
        return handleCallback(
          new Error("TYPE_REQUIRED_SEND_REQUEST"),
          null,
          callback
        );
      }
      const user = await User.findOne({
        where: { id: userId },
      });
      if (!user.hexSalt) {
        user.hexSalt = randomSaltHex();
        await user.save();
      }
      const parseUserPhoneNumber = parseSmartPhoneNumber(user.phoneNumber);
      const userPhoneCountryCode = parseUserPhoneNumber?.countryCode;
      
      const mobileHexArray = data.mobileNumbers
        .map((number) => {
          const fmtNumber = formatPhoneNumber(number, userPhoneCountryCode);
          if (fmtNumber?.e164) {
            // console.log(fmtNumber.e164);
            return createHmacExecute(fmtNumber.e164, user.hexSalt);
          }
          return null;
        })
        .filter((hash) => hash !== null && hash !== undefined);
      //   console.log(mobileHexArray);
      // Find existing contact hashes for the user
       if (mobileHexArray.length === 0) {
        return handleCallback(
          new Error("NO_VALID_MOBILE_NUMBERS"),
          null,
          callback
        );
      }
      const existingContacts = await UserContactList.findAll({
        where: {
          userId,
          contactHash: { [Op.in]: mobileHexArray },
          type: data.type,
        },
        attributes: ["contactHash"],
      });
     
      const existingHashes = existingContacts.map((c) => c.contactHash);
      // Filter out duplicates
      const newContactHashes = mobileHexArray.filter(
        (hash) => !existingHashes.includes(hash)
      );
      if (newContactHashes.length > 0) {
        await UserContactList.bulkCreate(
          newContactHashes.map((contactHash) => ({
        userId,
        contactHash,
        type: data.type,
          }))
        );
      }
      return handleCallback(
        null,
        { data: { success: true, mobileHexArray } },
        callback
      );
    } catch (error) {
      console.log(error.message)
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return handleCallback(new Error("CATCH_ERROR"), null, callback);
    }
  }
  static async checkMobileNumberInContactList(userId, data, callback) {
    try {
      
      let checkUserId = userId;
      if (data?.checkUserId) {
        checkUserId = data.checkUserId;
      }
      if (!["send", "request"].includes(data?.type)) {
        return handleCallback(
          new Error("TYPE_REQUIRED_SEND_REQUEST"),
          null,
          callback
        );
      }
      const user = await User.findOne({
        where: { id: checkUserId },
        attributes: ["id", "hexSalt"],
      });

      if (!user) {
        return handleCallback(new Error("USER_NOT_FOUND"), null, callback);
      }
      if (!user.hexSalt) {
        user.hexSalt = randomSaltHex();
        await user.save();
      }

      const mobileHex = createHmacExecute(data.mobileNumber, user.hexSalt);
      const isInContactList = await UserContactList.findOne({
        where: {
          userId: checkUserId,
          contactHash: mobileHex,
          type: data.type,
        },
      });

      return handleCallback(
        null,
        { data: { isInContactList: !!isInContactList } },
        callback
      );
    } catch (error) {
        console.log(error)
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return handleCallback(new Error("CATCH_ERROR"), null, callback);
    }
  }
  static async removeMobileNumberFromContactList(userId, data, callback) {
      try{
        if (!["send", "request"].includes(data?.type)) {
            return handleCallback(
            new Error("TYPE_REQUIRED_SEND_REQUEST"),
            null,
            callback
            );
        }
        if (!data?.mobileNumber) {
            return handleCallback(new Error("MOBILE_NUMBER_REQUIRED"), null, callback);
        }

      const user = await User.findOne({
        where: { id: userId },
        attributes: ["id", "hexSalt"],
      });

      if (!user) {
        return handleCallback(new Error("USER_NOT_FOUND"), null, callback);
      }
      if (!user.hexSalt) {
        user.hexSalt = randomSaltHex();
        await user.save();
      }

      const mobileHex = createHmacExecute(data.mobileNumber, user.hexSalt);
      await UserContactList.destroy({
        where: {
          userId,
          contactHash: mobileHex,
          type: data.type,
        },
      });

      return handleCallback(
        null,
        { data: { success: true } },
        callback
      );
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return handleCallback(new Error("CATCH_ERROR"), null, callback);
      }

  }
  static async clearContactList(userId, type, callback) {
    try {
       if (!["send", "request"].includes(type)) {
            return handleCallback(
            new Error("TYPE_REQUIRED_SEND_REQUEST"),
            null,
            callback
            );
        }
      await UserContactList.destroy({
        where: { userId, type },
      });
      return handleCallback(null, { data: { success: true } }, callback);
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return handleCallback(new Error("CATCH_ERROR"), null, callback);
    }
  }
}
