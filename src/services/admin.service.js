import "../config/environment.js";
import db from "../databases/models/index.js";
const { User } = db;
import { hashStr, compareHashedStr, generateToken } from "../libraries/auth.js";
import { randomSaltHex } from "../libraries/utility.js";
import * as Sentry from "@sentry/node";
const path = await import("path");

export default class AdminService {
  // Admin registration service method
  static async registerAdmin({ payload }, callback) {
    try {
      console.log("Payload in AdminService:", payload);
      const { name, email, phone, password } = payload;
      const existingUser = await User.findOne({
        where: { email, role: "ADMIN" },
      });
      if (existingUser) {
        return callback(new Error("ADMIN_EMAIL_ALREADY_REGISTERED"));
      }
      const salt = randomSaltHex(16);
      const hashedPassword = await hashStr(password + salt);
      const newAdmin = await User.create({
        name,
        email,
        phone_number: phone,
        password_hash: hashedPassword,
        hex_salt: salt,
        role: "ADMIN",
      });
      return callback(null, {
        data: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email },
      });
    } catch (error) {
      console.error("Error in registerAdmin:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("REGISTER_ADMIN_FAILED"));
    }
  }
  // Admin login service method
  static async loginAdminUser({ payload }, callback) {
    console.log("payload in service", payload);
    try {
      const { email, password } = payload;
      const adminUser = await User.findOne({ where: { email, role: "ADMIN" } });
      if (!adminUser) {
        return callback(new Error("ADMIN_NOT_FOUND"));
      }
      console.log("Admin user found:", {
        password,
        adminUserPasswordHash: adminUser.password_hash,
      });

      // Add password verification logic here
      const isPasswordValid = await compareHashedStr(
        password + adminUser.hex_salt,
        adminUser.password_hash,
      );
      if (!isPasswordValid) {
        return callback(new Error("ADMIN_INVALID_PASSWORD"));
      }
      if (adminUser.is_active === false) {
        return callback(new Error("DEACTIVATED_BY_SYSTEM_ADMIN"));
      }
      const payloadJwt = {
        id: adminUser.id,
        phoneNumber: adminUser.phone_number,
        email: adminUser.email,
        role: adminUser.role,
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
      const userData = adminUser.toJSON();
      delete userData.password_hash;
      delete userData.hex_salt;
      delete userData.ngo_certificate;
      return callback(null, {
        data: { user: userData, accessToken, refreshToken },
      });
    } catch (error) {
      console.error("Error in adminLogin:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("ADMIN_LOGIN_FAILED"));
    }
  }
  static async listNgo(request, callback) {
    try {
      const { page, limit, status } = request.payload;
      const offset = (page - 1) * limit;
      const whereClause = { role: "NGO" };
      if (status === "verified") {
        whereClause.is_verified = true;
      } else if (status === "unverified") {
        whereClause.is_verified = false;
      }
      const ngos = await User.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset: Number(offset),
        order: [["created_at", "DESC"]],
        attributes: { exclude: ["password_hash", "hex_salt"] },
      });

      const data = ngos.rows.map((ngo) => {
        const ngoData = ngo.toJSON();
        if (ngoData.ngo_certificate) {
          ngoData.ngo_certificate = `${process.env.BASE_URL}/uploads/ngo_certificates/${path.basename(ngoData.ngo_certificate)}`;
        } else {
          ngoData.ngo_certificate = null;
        }
        return ngoData;
      });
      return callback(null, { data: data });
    } catch (error) {
      console.error("Error in listNgos:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("LIST_NGOS_FAILED"));
    }
  }
  static async getNgoDetails(request, callback) {
    try {
      const { id } = request.payload;
      const ngo = await User.findOne({
        where: { id, role: "NGO" },
        attributes: { exclude: ["password_hash", "hex_salt"] },
      });
      if (!ngo) {
        return callback(new Error("NGO_NOT_FOUND"));
      }
      const ngoData = ngo.toJSON();
      if (ngoData.ngo_certificate) {
        ngoData.ngo_certificate = `${process.env.BASE_URL}/uploads/ngo_certificates/${path.basename(ngoData.ngo_certificate)}`;
      }
      return callback(null, { data: ngoData });
    } catch (error) {
      console.error("Error in getNgoDetails:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("GET_NGO_DETAILS_FAILED"));
    }
  }
  static async verifyNgo(request, callback) {
    try {
      const { id } = request.payload;
      const ngo = await User.findOne({
        where: { id, role: "NGO" },
      });
      if (!ngo) {
        return callback(new Error("NGO_NOT_FOUND"));
      }
      ngo.is_verified = true;
      await ngo.save();
      return callback(null, {
        data: {
          id: ngo.id,
          name: ngo.name,
          email: ngo.email,
          is_verified: ngo.is_verified,
        },
      });
    } catch (error) {
      console.error("Error in verifyNgo:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("VERIFY_NGO_FAILED"));
    }
  }
  static async rejectNgo(request, callback) {
    try {
      const { id } = request.payload;
      const ngo = await User.findOne({
        where: { id, role: "NGO" },
      });
      if (!ngo) {
        return callback(new Error("NGO_NOT_FOUND"));
      }
      ngo.is_verified = false;
      await ngo.save();
      return callback(null, {
        data: {
          id: ngo.id,
          name: ngo.name,
          email: ngo.email,
          is_verified: ngo.is_verified,
        },
      });
    } catch (error) {
      console.error("Error in rejectNgo:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("REJECT_NGO_FAILED"));
    }
  }
  static async changeNgoStatus(request, callback) {
    try {
      const { id, status } = request.payload;
      const ngo = await User.findOne({
        where: { id, role: "NGO" },
      });
      if (!ngo) {
        return callback(new Error("NGO_NOT_FOUND"));
      }
      ngo.is_active = status === "active";
      await ngo.save();
      return callback(null, {
        data: {
          id: ngo.id,
          name: ngo.name,
          email: ngo.email,
          is_active: ngo.is_active,
        },
      });
    } catch (error) {
      console.error("Error in changeNgoStatus:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("CHANGE_NGO_STATUS_FAILED"));
    }
  }
}
