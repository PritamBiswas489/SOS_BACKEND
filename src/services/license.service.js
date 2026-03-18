import db from "../databases/models/index.js";
import "../config/environment.js";
import { generateLicenseCode } from "../libraries/utility.js";
import * as Sentry from "@sentry/node";
const { Licenses } = db;
export default class LicenseService {
  static async generateLicenseCode({ userId, payload }, callback) {
    try {
      const licenseCode = generateLicenseCode();
      const newLicense = await Licenses.create({
        user_id: userId,
        license_key: licenseCode,
        status: "active",
      });
      return callback(null, { data: { licenseCode: newLicense.license_key } });
    } catch (error) {
      console.error("Error generating license code:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error('INSERT_ERROR'), null);
    }
  }
  static async getLicenseCode({ userId, payload }, callback) {
    try {
      const license = await Licenses.findOne({
        where: { user_id: userId },
      });
      if (!license) {
        return callback(null, { data: { licenseCode: null } });
      }
      return callback(null, { data: { licenseCode: license.license_key } });
    } catch (error) {
      console.error("Error fetching license code:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error('FETCH_ERROR'), null);
    }
  }
}
