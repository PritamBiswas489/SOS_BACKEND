import db from "../databases/models/index.js";
import { generateOtp, getAddress } from "../libraries/utility.js";
import * as Sentry from "@sentry/node";
import {
  otpWhatsappService,
  otpSmsService,
} from "../services/messages.service.js";
import { registerValidator } from "../validators/register.validator.js";
import { hashStr, compareHashedStr, generateToken } from "../libraries/auth.js";
import { setNewPinValidator } from "../validators/setNewPin.validator.js";
import redisClient from "../config/redis.config.js";
import { randomSaltHex } from "../libraries/utility.js";
import OtpVerificationService from "../services/otpVerification.service.js";
import logger from "../config/winston.js";
 

const { User, UserDevices, Op } = db;

export default class LoginController {
  /**
   * Send OTP to mobile number
   * @param {*} request
   * @returns
   */
  static async sendOtpToMobileNumber(request) {
    const {
      payload,
      headers: { i18n },
    } = request;

    try {
      const phoneNumber = payload?.phoneNumber;
      const messageType = payload?.messageType || "sms";
      const appHash = payload?.appHash || "";

      const phoneRegex = /^\+\d{1,3}\d{4,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("INVALID_PHONE_NUMBER_FORMAT") },
        };
      }
      const otpVerification =
        await OtpVerificationService.createOtpVerification({ phoneNumber });

     

      // const [whatsappResult, smsResult] = await Promise.all([
      //   messageType === "whatsapp"
      //     ? otpWhatsappService(phoneNumber, otpVerification.otp_code)
      //     : null,
      //   messageType === "sms" ? otpSmsService(phoneNumber, otpVerification.otp_code, appHash) : null,
      // ]);

      // if (messageType === "sms" && smsResult?.error) {
      //   return {
      //     status: 500,
      //     data: [],
      //     error: {
      //       message: i18n.__("SMS_SEND_FAILED"),
      //       reason: smsResult.error,
      //     },
      //   };
      // }

      // if (messageType === "whatsapp" && whatsappResult?.error) {
      //   return {
      //     status: 500,
      //     data: [],
      //     error: {
      //       message: i18n.__("WHATSAPP_SEND_FAILED"),
      //       reason: whatsappResult.error,
      //     },
      //   };
      // }

      return {
        status: 200,
        data: { whatsapp: null, sms: null, otpCode: otpVerification.otp_code },
        message: i18n.__("OTP_SENT_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      logger.error("ERROR In sendOtpToMobileNumber", { error: e });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("OTP_SEND_FAILED"), reason: e.message },
      };
    }
  }

  //* Verify OTP for login
  static async verifyOtp(request) {
    const {
      payload,
      headers: { i18n },
    } = request;
    try {
      const phoneNumber = payload?.phoneNumber;
      const otpCode = payload?.otp;
      const verificationResult = await OtpVerificationService.verifyOtp({
        phoneNumber,
        otpCode,
      });

      if (!verificationResult.valid) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__(verificationResult.message) },
        };
      }
      return {
        status: 200,
        data: [],
        message: i18n.__("OTP_VERIFIED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      logger.error("ERROR In verifyOtp", { error: e });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: {
          message: i18n.__("OTP_VERIFICATION_FAILED"),
          reason: e.message,
        },
      };
    }
  }
  /**
   * Create user after OTP verification for website login
   * If user already exists, it will return the access and refresh token
   * If user does not exist, it will create a new user and return the access and refresh token
   * The OTP verification is done before calling this function
   * @param {*} request
   * @returns
   */

  //* Create user after OTP verification for website login
  static async createUserAfterOtpVerification(request) {
    const {
      payload,
      headers: { i18n },
    } = request;
    try {
      const phoneNumber = payload?.phoneNumber;
      const role = "USER";
      const user = await User.findOne({ where: { phone_number: phoneNumber, role } });
      let jwtPayload;
      if (user) {
         jwtPayload = {
          id: user.id,
          phoneNumber: user.phone_number,
          name: user.name,
          email: user.email,
          role: user.role,
          profile_photo: user.profile_photo,
        };
      } else {
        const newUser = await User.create({ phone_number: phoneNumber,  role });
         jwtPayload = {
          id: newUser.id,
          phoneNumber: newUser.phone_number,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          profile_photo: newUser.profile_photo,
        };
      }
      const accessToken = await generateToken(
        jwtPayload,
        process.env.JWT_ALGO,
        process.env.ACCESS_TOKEN_SECRET_KEY,
        Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
      );

      const refreshToken = await generateToken(
        jwtPayload,
        process.env.JWT_ALGO,
        process.env.REFRESH_TOKEN_SECRET_KEY,
        Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
      );

      return {
        status: 200,
        data: { user: jwtPayload, accessToken, refreshToken },
        message: i18n.__("USER_CREATED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      logger.error("ERROR In createUserAfterOtpVerification", { error: e });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("USER_CREATION_FAILED"), reason: e.message },
      };
    }
  }

  /**
   * Create or verify PIN by phone number
   * @param {*} request
   * @returns
   */
  static async createOrVerifyPinByPhoneNumber(request) {
    const {
      payload,
      headers: { i18n, deviceid, deviceName, deviceType, deviceLocation },
    } = request;
    const redisKey = `login:fail:${deviceid}`;
    const MAX_ATTEMPTS = 5;
    const BLOCK_DURATION = 60; //in seconds

    try {
      const insertedData = {
        phoneNumber: payload.phoneNumber,
        pinCode: payload.pinCode,
        type: payload.type || "login",
      };

      const [validationError, validatedData] = await registerValidator(
        insertedData,
        i18n,
      );
      if (validationError) return validationError;

      let isNewUser = false;
      let alreadyDeviceLoggedInUser = false;

      const user = await User.findOne({
        where: { phoneNumber: validatedData?.phoneNumber },
      });

      if (!user) {
        isNewUser = true;
      }

      const attempts = await redisClient.get(redisKey);
      if (
        attempts &&
        parseInt(attempts) >= MAX_ATTEMPTS &&
        validatedData.type === "login"
      ) {
        const ttl = await redisClient.ttl(redisKey);
        return {
          status: 429,
          isNewUser,
          data: [],
          error: {
            message: i18n.__("TOO_MANY_FAILED_ATTEMPTS", Math.ceil(ttl / 60)),
          },
        };
      }

      if (!isNewUser) {
        if (validatedData.type === "login") {
          // Login flow if user exists type login
          const isPinCodeValid = await compareHashedStr(
            validatedData?.pinCode,
            user?.password,
          );
          if (!isPinCodeValid) {
            const newAttempts = await redisClient.incr(redisKey);
            if (newAttempts === 1) {
              await redisClient.expire(redisKey, BLOCK_DURATION);
            }
            const remaining = MAX_ATTEMPTS - newAttempts;
            if (newAttempts >= MAX_ATTEMPTS) {
              return {
                status: 429,
                isNewUser,
                data: [],
                error: {
                  message: i18n.__(
                    "TOO_MANY_FAILED_ATTEMPTS",
                    Math.ceil(BLOCK_DURATION / 60),
                  ),
                },
              };
            } else {
              return {
                status: 401,
                isNewUser,
                data: [],
                error: {
                  message: i18n.__(
                    "WRONG_PASSWORD_ATTEMPTS_REMAINING",
                    remaining,
                  ),
                },
              };
            }
          }

          await redisClient.del(redisKey);
        } else if (validatedData.type === "register") {
          // Register flow if user exists type register
          user.password = await hashStr(validatedData?.pinCode);
          await user.save();
        }

        const jwtPayload = {
          id: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role,
        };

        if (!user.hexSalt) {
          user.hexSalt = randomSaltHex();
          await user.save();
        }

        if (!user.logged_device_id) {
          user.logged_device_id = deviceid;
          await user.save();
        }

        const loggedInDevice = await UserDevices.count({
          where: { userId: user.id, deviceID: { [Op.ne]: deviceid } },
        });

        if (loggedInDevice === 5) {
          return {
            status: 500,
            data: [],
            error: {
              message: i18n.__("LIMIT_REACHED_UPTO_5_DEVICES"),
              reason: "Device limit reached",
            },
          };
        }

        const getlatlng = deviceLocation.split(",");
        const latitude = getlatlng?.[0] ? parseFloat(getlatlng[0]) : null;
        const longitude = getlatlng?.[1] ? parseFloat(getlatlng[1]) : null;
        let fetchedLocation = true;
        let addressLocation = "Unknown location";

        const checkDevice = await UserDevices.findOne({
          where: { userId: user.id, deviceID: deviceid },
        });
        if (checkDevice) {
          if (
            parseFloat(checkDevice.latitude) === latitude &&
            parseFloat(checkDevice.longitude) === longitude
          ) {
            fetchedLocation = false;
            addressLocation = checkDevice.lastLoggedInLocation;
            if (!addressLocation) {
              fetchedLocation = true;
            }
          }
        }
        console.log({ fetchedLocation, latitude, longitude, addressLocation });

        if (fetchedLocation && (latitude || longitude)) {
          const location = await getAddress(latitude, longitude);
          addressLocation = location?.address || "Unknown location";
        }

        // Ensure device record exists and update login info
        const [deviceRecord, created] = await UserDevices.findOrCreate({
          where: { userId: user.id, deviceID: deviceid },
          defaults: {
            userId: user.id,
            deviceID: deviceid,
            deviceName: deviceName,
            deviceType: deviceType,
            firstLoggedIn: new Date(),
            lastLoggedIn: new Date(),
            lastLoggedInLocation: addressLocation,
            latitude: latitude ? latitude.toString() : null,
            longitude: longitude ? longitude.toString() : null,
          },
        });

        if (!created) {
          deviceRecord.lastLoggedIn = new Date();
          deviceRecord.lastLoggedInLocation = addressLocation;
          deviceRecord.latitude = latitude ? latitude.toString() : null;
          deviceRecord.longitude = longitude ? longitude.toString() : null;
          await deviceRecord.save();
        }

        const accessToken = await generateToken(
          jwtPayload,
          process.env.JWT_ALGO,
          process.env.ACCESS_TOKEN_SECRET_KEY,
          Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
        );

        const refreshToken = await generateToken(
          jwtPayload,
          process.env.JWT_ALGO,
          process.env.REFRESH_TOKEN_SECRET_KEY,
          Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        );

        return {
          status: 200,
          isNewUser,
          data: { accessToken, refreshToken, alreadyDeviceLoggedInUser },
          message: i18n.__("SUCCESSFULLY_VERIFIED_PIN"),
          error: {},
        };
      }

      if (isNewUser) {
        validatedData.password = await hashStr(validatedData?.pinCode);
        const newUser = await User.create({
          phoneNumber: validatedData?.phoneNumber,
          password: validatedData?.password,
          logged_device_id: deviceid,
        });

        if (!newUser) {
          return {
            status: 500,
            isNewUser,
            data: [],
            error: { message: i18n.__("FAILED_TO_CREATE_NEW_USER") },
          };
        }

        if (!newUser.hexSalt) {
          newUser.hexSalt = randomSaltHex();

          await newUser.save();
        }

        const getlatlng = deviceLocation.split(",");
        const latitude = getlatlng?.[0] ? parseFloat(getlatlng[0]) : null;
        const longitude = getlatlng?.[1] ? parseFloat(getlatlng[1]) : null;

        let location = await getAddress(latitude, longitude);

        // Ensure device record exists and update login info
        const [deviceRecord, created] = await UserDevices.findOrCreate({
          where: { userId: newUser.id, deviceID: deviceid },
          defaults: {
            userId: newUser.id,
            deviceID: deviceid,
            deviceName: deviceName,
            deviceType: deviceType,
            firstLoggedIn: new Date(),
            lastLoggedIn: new Date(),
            lastLoggedInLocation: location?.address || "Unknown location",
            latitude: latitude ? latitude.toString() : null,
            longitude: longitude ? longitude.toString() : null,
          },
        });

        if (!created) {
          deviceRecord.lastLoggedIn = new Date();
          deviceRecord.lastLoggedInLocation =
            location.address || "Unknown location";
          deviceRecord.latitude = latitude ? latitude.toString() : null;
          deviceRecord.longitude = longitude ? longitude.toString() : null;
          await deviceRecord.save();
        }

        const jwtPayload = {
          id: newUser.id,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
        };

        const accessToken = await generateToken(
          jwtPayload,
          process.env.JWT_ALGO,
          process.env.ACCESS_TOKEN_SECRET_KEY,
          Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
        );

        const refreshToken = await generateToken(
          jwtPayload,
          process.env.JWT_ALGO,
          process.env.REFRESH_TOKEN_SECRET_KEY,
          Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        );

        return {
          status: 200,
          isNewUser,
          data: { accessToken, refreshToken, alreadyDeviceLoggedInUser },
          message: i18n.__("SUCCESSFULLY_CREATED_NEW_USER"),
          error: {},
        };
      }

      return {
        status: 200,
        isNewUser,
        data: validatedData,
        message: i18n.__("SUCCESSFULLY_CREATED_OR_VERIFIED_PIN"),
        error: {},
      };
    } catch (e) {
      logger.error("ERROR In createOrVerifyPinByPhoneNumber", { error: e });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
}
