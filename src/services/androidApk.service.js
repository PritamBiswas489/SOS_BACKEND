import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
const { AndroidApk } = db;
import Joi from "joi";
import path from "path";
export default class AndroidApkService {
  // Service method for uploading Android APK
  static async uploadAndroidApp({ payload }, callback) {
    try {
      const androidApkPayloadSchema = Joi.object({
        version: Joi.string().max(50).required(),
        apkFile: Joi.object({
          fieldname: Joi.string().valid("apkFile").required(),
          originalname: Joi.string().required(),
          encoding: Joi.string().required(),
          mimetype: Joi.string()
            .valid(
              "application/vnd.android.package-archive",
              "application/octet-stream",
            )
            .required(),
          destination: Joi.string().required(),
          filename: Joi.string().required(),
          path: Joi.string().required(),
          size: Joi.number().integer().min(1).required(),
        }).required(),
      });
      const { error, value } = androidApkPayloadSchema.validate(payload);
      if (error) {
        return callback(new Error("INVALID_APK_PAYLOAD"));
      }
      const createdApk = await AndroidApk.create({
        version: value.version,
        apk_file: value.apkFile.path,
        req_file: value.apkFile,
      });
      return callback(null, {
        status: 200,
        data: { id: createdApk.id, version: createdApk.version },
        message: "APK_UPLOADED_SUCCESSFULLY",
      });
    } catch (error) {
      console.error("Error in uploadAndroidApp:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("UPLOAD_ANDROID_APP_FAILED"));
    }
  }
  // Service method for getting the list of released APKs with pagination
  static async getApkReleases({ payload }, callback) {
    try {
      const { limit = 10, offset = 0 } = payload;
      const releasedApks = await AndroidApk.findAndCountAll({
        limit: Number(limit),
        offset: Number(offset),
        order: [["created_at", "DESC"]],
      });
      return callback(null, {
        status: 200,
        data: releasedApks.rows.map((apk) => {
          const basename = apk.apk_file ? path.basename(apk.apk_file) : null;
          return {
            id: apk.id,
            version: apk.version,
            apkFile: basename
              ? `${process.env.BASE_URL}/uploads/apks/${basename}`
              : null,
            createdAt: apk.created_at,
          };
        }),
        message: "GET_APK_RELEASES_SUCCESSFUL",
      });
    } catch (error) {
      console.error("Error in getApkReleases:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("GET_APK_RELEASES_FAILED"));
    }
  }
  // Service method for downloading the latest Android APK
  static async downloadLatestApk(request) {
        try {
            const latestApk = await AndroidApk.findOne({
                order: [["created_at", "DESC"]],
            });
            if (!latestApk) {
                return {
                    status: 404,
                    data: null,
                    message: request.headers?.i18n.__("LATEST_APK_NOT_FOUND"),
                    error: null,
                };
            }
            return {
                status: 200,
                data: {
                    version: latestApk.version,
                    apkFile: `${process.env.BASE_URL}/uploads/apks/${path.basename(latestApk.apk_file)}`,
                },
                message: request.headers?.i18n.__("DOWNLOAD_LATEST_APK_SUCCESSFUL"),
                error: null,
            };
        }catch(error){
            console.error("Error in downloadLatestApk:", error);
            process.env.NODE_ENV === "production" && Sentry.captureException(error);
            return {
                status: 400,
                data: null,
                message: request.headers?.i18n.__("DOWNLOAD_LATEST_APK_FAILED"),
                error: { reason: error.message },
            };
        }
  }
}
