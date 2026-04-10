import db from "../databases/models/index.js";
import "../config/environment.js";
import { generateOtp } from "../libraries/utility.js";
import logger from "../config/winston.js";
const { OtpVerifications } = db;

export default class OtpVerificationService {
  static async createOtpVerification({ phoneNumber }) {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    const otpVerification = await OtpVerifications.create({
      phone_number: phoneNumber,
      otp_code: otp,
      expires_at: expiresAt,
    });

    return otpVerification;
  }
  static async verifyOtp({ phoneNumber, otpCode }) {
    const otpVerification = await OtpVerifications.findOne({
      where: {
        phone_number: phoneNumber,
        otp_code: otpCode,
      },
    });
    if (!otpVerification) {
      return { valid: false, message: "INVALID_OTP" };
    }
    if (otpVerification.is_used) {
      return { valid: false, message: "OTP_HAS_ALREADY_BEEN_USED" };
    }
    if (new Date() > otpVerification.expires_at) {
      return { valid: false, message: "OTP_HAS_EXPIRED" };
    }
    return { valid: true, message: "OTP_IS_VALID" };
  }
}
