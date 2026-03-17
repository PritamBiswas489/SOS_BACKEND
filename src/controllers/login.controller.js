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

    let isNewUser = false;

    try {
      const otp = generateOtp();
      const phoneNumber = payload.phoneNumber;
      const messageType = payload.messageType || "whatsapp";
      const appHash = payload.appHash || '';

      const phoneRegex = /^\+\d{1,3}\d{4,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("INVALID_PHONE_NUMBER_FORMAT") },
        };
      }

      

      const user = await User.findOne({
        where: { phoneNumber: payload?.phoneNumber },
      });

      if (!user) {
        isNewUser = true;
      }

      const [whatsappResult, smsResult] = await Promise.all([
        messageType === "whatsapp"
          ? otpWhatsappService(phoneNumber, otp)
          : null,
        messageType === "sms" ? otpSmsService(phoneNumber, otp, appHash) : null,
      ]);

      if (messageType === "sms" && smsResult?.error) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("SMS_SEND_FAILED"),
            reason: smsResult.error,
          },
        };
      }

      if (messageType === "whatsapp" && whatsappResult?.error) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("WHATSAPP_SEND_FAILED"),
            reason: whatsappResult.error,
          },
        };
      }

      return {
        status: 200,
        data: { isNewUser, whatsapp: whatsappResult, sms: smsResult, otp },
        message: i18n.__("OTP_SENT_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("OTP_SEND_FAILED"), reason: e.message },
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
        i18n
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
            user?.password
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
                  message: i18n.__("TOO_MANY_FAILED_ATTEMPTS", Math.ceil(BLOCK_DURATION / 60)),
                },
              };
            } else {
              return {
                status: 401,
                isNewUser,
                data: [],
                error: {
                  message: i18n.__("WRONG_PASSWORD_ATTEMPTS_REMAINING", remaining),
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

        if(!user.logged_device_id){
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
            error: { message: i18n.__("LIMIT_REACHED_UPTO_5_DEVICES"), reason: 'Device limit reached' },
          };
        }


        const getlatlng = deviceLocation.split(',');
        const latitude = getlatlng?.[0] ? parseFloat(getlatlng[0]) : null;
        const longitude = getlatlng?.[1] ? parseFloat(getlatlng[1]) : null;
        let fetchedLocation = true; 
        let addressLocation = 'Unknown location';

       const checkDevice = await UserDevices.findOne({
          where: { userId: user.id, deviceID: deviceid },
        });
        if(checkDevice){
          if(parseFloat(checkDevice.latitude) === latitude && parseFloat(checkDevice.longitude) === longitude){
             fetchedLocation = false; 
             addressLocation= checkDevice.lastLoggedInLocation;
             if(!addressLocation){
                fetchedLocation = true;
             }
          }
        }
        console.log({fetchedLocation, latitude, longitude, addressLocation});
       
        if(fetchedLocation && (latitude || longitude)){
            const  location = await getAddress(latitude, longitude);
            addressLocation = location?.address || 'Unknown location';
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
            lastLoggedInLocation:  addressLocation,
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
          Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
        );

        const refreshToken = await generateToken(
          jwtPayload,
          process.env.JWT_ALGO,
          process.env.REFRESH_TOKEN_SECRET_KEY,
          Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
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
          logged_device_id: deviceid
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

        const getlatlng = deviceLocation.split(',');
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
            lastLoggedInLocation: location?.address || 'Unknown location',
            latitude: latitude ? latitude.toString() : null,
            longitude: longitude ? longitude.toString() : null,
          },
        });

        if (!created) {
          deviceRecord.lastLoggedIn = new Date();
          deviceRecord.lastLoggedInLocation = location.address || 'Unknown location';
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
          Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
        );

        const refreshToken = await generateToken(
          jwtPayload,
          process.env.JWT_ALGO,
          process.env.REFRESH_TOKEN_SECRET_KEY,
          Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
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
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  /**
   * Update PIN by phone number
   * @param {*} request
   * @returns
   */
  static async updatePinByPhoneNumber(request) {
    const {
      payload,
      headers: { i18n },
    } = request;

    try {
      const updatedData = {
        phoneNumber: payload.phoneNumber,
        pinCode: payload.pinCode,
      };

      const [validationError, validatedData] = await setNewPinValidator(
        updatedData,
        i18n
      );
      if (validationError) return validationError;

      const user = await User.findOne({
        where: { phoneNumber: validatedData?.phoneNumber },
      });

      if (!user) {
        return {
          status: 404,
          data: [],
          error: {
            message: i18n.__("USER_NOT_FOUND_WITH_PHONE", {
              phone: validatedData?.phoneNumber,
              pinCode: validatedData?.pinCode,
            }),
          },
        };
      }

      user.password = await hashStr(validatedData?.pinCode);
      await user.save();

      return {
        status: 200,
        data: {
          phoneNumber: user.phoneNumber,
          pinCode: validatedData?.pinCode,
        },
        message: i18n.__("SUCCESSFULLY_UPDATED_PIN"),
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
}
