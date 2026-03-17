import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const {
  FavouriteQrCodes,
  PisoPayTransactionInfos,
  NinePayTransactionInfos,
  kessPayTransactionInfos,
  Op,
  User,
} = db;

export default class FavouriteQrCodeService {
  static async addFavouriteQrCode({ userId, payload, i18n }, callback) {
    const { label, transaction_id, country } = payload;
    try {
      let existingFavourite;
      if (country === "PH") {
        //philippines
        existingFavourite = await PisoPayTransactionInfos.findOne({
          where: {
            userId: userId,
            id: transaction_id,
          },
        });
      }
      if (country === "VN") {
        //vietnam
        existingFavourite = await NinePayTransactionInfos.findOne({
          where: {
            userId: userId,
            id: transaction_id,
          },
        });
      }
      if (country === "KH") {
        //cambodia
        existingFavourite = await kessPayTransactionInfos.findOne({
          where: {
            userId: userId,
            id: transaction_id,
          },
        });
      }
      if (!existingFavourite?.id) {
        return callback(new Error("FAVOURITE_QR_CODE_NOT_FOUND"), null);
      }
      const qrCode = existingFavourite.qr_code;
      const checkDuplicate = await FavouriteQrCodes.findOne({
        where: {
          userId: userId,
          qrCodeData: qrCode,
        },
      });
      if (checkDuplicate) {
        return callback(new Error("FAVOURITE_QR_CODE_ALREADY_EXISTS"), null);
      }
      const newFavourite = await FavouriteQrCodes.create({
        userId: userId,
        label: label,
        qrCodeData: qrCode,
        country: country,
      });
      return callback(null, { data: newFavourite });
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("FAVOURITE_QR_CODE_ADDITION_FAILED"), null);
    }
  }
  static async getFavouriteQrCodes({ userId, payload, i18n }, callback) {
    try {
      const { page = 1, limit = 10, country = null, qrCode = null } = payload;
      const offset = (page - 1) * limit;
      const whereClause = { userId: userId };
      if (country) {
        whereClause.country = country;
      }
      if (qrCode) {
        whereClause.qrCodeData = qrCode;
      }
      const favourites = await FavouriteQrCodes.findAll({
        where: whereClause,
        limit: limit,
        offset: offset,
      });
      return callback(null, { data: favourites });
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("FAVOURITE_QR_CODE_RETRIEVAL_FAILED"), null);
    }
  }
  static async removeFavouriteQrCode({ userId, id, i18n }, callback) {
    try {
      const favourite = await FavouriteQrCodes.findOne({
        where: {
          userId: userId,
          id: id,
        },
      });
      if (!favourite) {
        return callback(new Error("FAVOURITE_QR_CODE_NOT_FOUND"), null);
      }
      await FavouriteQrCodes.destroy({
        where: {
          userId: userId,
          id: id,
        },
      });
      return callback(null, {
        data: { message: "FAVOURITE_QR_CODE_REMOVED_SUCCESSFULLY" },
      });
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("FAVOURITE_QR_CODE_REMOVAL_FAILED"), null);
    }
  }
}
