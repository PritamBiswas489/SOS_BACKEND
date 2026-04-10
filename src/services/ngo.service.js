import "../config/environment.js";
import db from "../databases/models/index.js";
const { User, Licenses, UserKycDocuments } = db;
import { hashStr , compareHashedStr, generateToken} from "../libraries/auth.js";
import { randomSaltHex } from "../libraries/utility.js";
import * as Sentry from "@sentry/node";
import KycService from "./kyc.service.js";
import UserService from "./user.service.js";
import path from "path";
import { promisify } from "../libraries/utility.js";
import logger from "../config/winston.js";
 

export default class NgoService {
  static async registerNgo({ payload }, callback) {
    try {
      const {
        name,
        email,
        phoneNumber,
        password,
        numberOfUser,
        certificateFile,
      } = payload;
      const existingUser = await User.findOne({
        where: { email, role: "NGO" },
      });
      if (existingUser) {
        return callback(new Error("NGO_EMAIL_ALREADY_REGSISTERED"));
      }
      const salt = randomSaltHex(16);
      const hashedPassword = await hashStr(password + salt);
      const newNgo = await User.create({
        name,
        email,
        phone_number: phoneNumber,
        password_hash: hashedPassword,
        hex_salt: salt,
        ngo_number_of_user_assigned: numberOfUser,
        ngo_certificate: certificateFile,
        role: "NGO",
      });
      return callback(null, {
        data: { id: newNgo.id, name: newNgo.name, email: newNgo.email },
      });
    } catch (error) {
      console.error("Error in registerNgo:", error);
      logger.error("ERROR In registerNgo", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("REGISTER_NGO_FAILED"));
    }
  }
  static async ngoLogin({ payload }, callback) {
    console.log("payload in service", payload);
    try {
      const { email, password } = payload;
      const ngoUser = await User.findOne({ where: { email, role: "NGO" } });
      if (!ngoUser) {
        return callback(new Error("NGO_NOT_FOUND"));
      }
      console.log("NGO user found:", {
        password,
        ngoUserPasswordHash: ngoUser.password_hash,
      });

      // Add password verification logic here
      const isPasswordValid = await compareHashedStr(
        password + ngoUser.hex_salt,
        ngoUser.password_hash,
      );
      if (!isPasswordValid) {
        return callback(new Error("NGO_INVALID_PASSWORD"));
      }
      if (ngoUser.is_active === false) {
        return callback(new Error("DEACTIVATED_BY_SYSTEM_ADMIN"));
      }
      if (ngoUser.is_verified === false) {
        return callback(new Error("NGO_NOT_VERIFIED_YET"));
      }
      const payloadJwt = {
        id: ngoUser.id,
        phoneNumber: ngoUser.phone_number,
        email: ngoUser.email,
        role: ngoUser.role,
      };
      const accessToken = await generateToken(
        payloadJwt,
        process.env.JWT_ALGO,
        process.env.ACCESS_TOKEN_SECRET_KEY,
        Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
      );
      const refreshToken = await generateToken(
        payloadJwt,
        process.env.JWT_ALGO,
        process.env.REFRESH_TOKEN_SECRET_KEY,
        Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
      );
      const userData = ngoUser.toJSON();
      delete userData.password_hash;
      delete userData.hex_salt;
      delete userData.ngo_certificate;
      return callback(null, {
        data: { user: userData, accessToken, refreshToken },
      });
    } catch (error) {
      console.error("Error in ngoLogin:", error);
      logger.error("ERROR In ngoLogin", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("NGO_LOGIN_FAILED"));
    }
  }
  // Helper: wrap callback-style KycService methods into promises

  static async registerUserForNgo({ file, payload, headers }, callback) {
    console.log("Payload for registering user under NGO:", payload);

    const transaction = await db.sequelize.transaction();
    try {
      // 1. Fetch NGO with lock
      const ngoDetails = await User.findOne({
        where: { id: payload.ngo_id, role: "NGO" },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      // 2. All guard checks INSIDE the transaction (so rollback is always possible)
      if (!ngoDetails) {
        await transaction.rollback();
        return callback(new Error("NGO_NOT_FOUND"));
      }

      if (
        ngoDetails.ngo_number_of_user_assigned ===
        ngoDetails.ngo_number_of_user_registered
      ) {
        await transaction.rollback();
        return callback(new Error("NGO_USER_LIMIT_REACHED"));
      }

      if (!file?.path) {
        await transaction.rollback();
        return callback(new Error("NGO_CERTIFICATE_FILE_REQUIRED"));
      }

      const {
        fullName,
        emailAddress,
        phoneNumber,
        documentType,
        residentialAddress,
        ngo_id,
      } = payload;

      // 3. Phone uniqueness check INSIDE the transaction
      const checkExistingUser = await User.findOne({
        where: { phone_number: phoneNumber, role: "USER" },
        transaction, // <-- was missing, could cause phantom reads
      });
      if (checkExistingUser) {
        await transaction.rollback();
        return callback(new Error("USER_PHONE_NUMBER_ALREADY_REGISTERED"));
      }

      // 4. Create user
      const createUser = await User.create(
        {
          name: fullName,
          email: emailAddress,
          phone_number: phoneNumber,
          ngo_id,
        },
        { transaction },
      );

      if (!createUser) {
        await transaction.rollback();
        return callback(new Error("USER_CREATION_FAILED"));
      }

      // 5. Increment registered count
      const newRegisteredCount = ngoDetails.ngo_number_of_user_registered + 1;
      await ngoDetails.update(
        { ngo_number_of_user_registered: newRegisteredCount },
        { transaction },
      );

      // 6. Submit KYC — properly awaited via promisify
      const kycResult = await promisify(
        
        KycService.submitKycDocuments.bind(KycService),
        {
          userId: createUser.id,
          payload: { fullName, residentialAddress, documentType },
          file,
          headers,
          transaction,
        },
      );

      // 7. Create license
      const licenseNumber = `KBY-${String(ngo_id).padStart(2, "0")}-${String(newRegisteredCount).padStart(6, "0")}`;
      const license = await Licenses.create(
        {
          user_id: createUser.id,
          license_key: licenseNumber,
          status: "active",
        },
        { transaction },
      );

      if (!license) {
        await transaction.rollback();
        return callback(new Error("LICENSE_CREATION_FAILED"));
      }

      // 8. Commit — transaction is now fully done
      await transaction.commit();

      // 9. Auto-approve KYC AFTER commit, WITHOUT passing the committed transaction
      //    Fire-and-forget: don't await, don't let its failure affect the response
      KycService.changeStatus(
        { userId: createUser.id, payload: { status: "approved" }, headers },
        (err) => {
          if (err)
            console.error(
              "Auto-approve KYC failed for user",
              createUser.id,
              err,
            );
        },
      );

      return callback(null, {
        data: { user: createUser, kycDocument: kycResult?.data, license },
      });
    } catch (error) {
      logger.error("ERROR In registerUserForNgo", { error: error });
      if (process.env.NODE_ENV === "production") Sentry.captureException(error);
      // Guard against double-rollback if already committed
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      return callback(new Error("REGISTER_USER_FOR_NGO_FAILED"));
    }
  }
  // Service method for listing users under an NGO
  static async listUsersForNgo({ payload, headers }, callback) {
    try {
      const { ngo_id, limit = 10, page = 1 } = payload;
      const offset = (page - 1) * limit;
      const users = await User.findAndCountAll({
        where: { ngo_id, role: "USER" },
        limit: Number(limit),
        offset: Number(offset),

        attributes: {
          exclude: [
            "password_hash",
            "hex_salt",
            "ngo_certificate",
            "ngo_number_of_user_assigned",
            "ngo_number_of_user_registered",
            "deleted_at",
          ],
        },
        include: [
          {
            model: Licenses,
            as: "licenses",
            attributes: ["license_key", "status"],
          },
          {
            model: UserKycDocuments,
            as: "kyc_documents",
            attributes: ["address", "document_type", "document_path", "status"],
          },
        ],
        order: [["created_at", "DESC"]],
      });
      const data = users.rows.map((user) => {
        const userData = user.toJSON();
        if (userData.kyc_documents?.document_path) {
          console.log(
            "User KYC document path:",
            userData.kyc_documents.document_path,
          );
          userData.kyc_documents.document_path = `${process.env.BASE_URL}/uploads/kyc/${path.basename(userData.kyc_documents.document_path)}`;
        }
        return userData;
      });
      return callback(null, {
        data: {
          rows: data,
          total: users.count,
          currentPage: Number(offset / limit) + 1,
          totalPages: Math.ceil(users.count / limit),
        },
      });
    } catch (error) {
      console.error("Error in listUsersForNgo:", error);
      logger.error("ERROR In listUsersForNgo", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("LIST_USERS_FOR_NGO_FAILED"));
    }
  }
}