import "../config/environment.js";
import db from "../databases/models/index.js";
const { User, Licenses, UserKycDocuments } = db;
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
      const { page, limit, status, ngo_id = null } = request.payload;
      const offset = (page - 1) * limit;
      const whereClause = { role: "NGO" };
      if (status === "verified") {
        whereClause.is_verified = true;
      } else if (status === "unverified") {
        whereClause.is_verified = false;
      }
      if (ngo_id) {
        whereClause.id = ngo_id;
      }
      const ngos = await User.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset: Number(offset),
        order: [["created_at", "DESC"]],
        attributes: { exclude: ["password_hash", "hex_salt"] },
        order: [["created_at", "DESC"]],
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
      return callback(null, {
        data: {
          rows: data,
          total: ngos.count,
          currentPage: Number(page),
          totalPages: Math.ceil(ngos.count / limit),
        },
      });
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
  static async upgradeNgoUserLimit(request, callback) {
    try {
      const { id, additional_limit } = request.payload;
      const ngo = await User.findOne({
        where: { id, role: "NGO" },
      });
      if (!ngo) {
        return callback(new Error("NGO_NOT_FOUND"));
      }
      ngo.ngo_number_of_user_assigned += Number(additional_limit);
      await ngo.save();
      return callback(null, {
        data: {
          id: ngo.id,
          name: ngo.name,
          email: ngo.email,
          ngo_number_of_user_assigned: ngo.ngo_number_of_user_assigned,
        },
      });
    } catch (error) {
      console.error("Error in upgradeNgoUserLimit:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("UPGRADE_NGO_USER_LIMIT_FAILED"));
    }
  }

  static async getNgoAutocompleteByName(request, callback) {
    try {
      const { name } = request.payload;
      const ngos = await User.findAll({
        where: {
          role: "NGO",
          name: { [db.Sequelize.Op.iLike]: `%${name}%` },
        },
        attributes: ["id", "name"],
        limit: 10,
      });
      return callback(null, { data: ngos });
    } catch (error) {
      console.error("Error in getNgoAutocompleteByName:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("GET_NGO_AUTOCOMPLETE_FAILED"));
    }
  }
  // Admin service method for listing users under an NGO with pagination and filtering
  static async listUsers(request, callback) {
    try {
      const { page, limit, ngo_id } = request.payload;
      const offset = (page - 1) * limit;
      const whereClause = { role: "USER" };
      if (ngo_id) {
        whereClause.ngo_id = ngo_id;
      }
      const users = await User.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset: Number(offset),
        order: [["created_at", "DESC"]],
        attributes: { exclude: ["password_hash", "hex_salt"] },
        include: [
          {
            model: Licenses,
            as: "licenses",
            attributes: ["license_key", "status"],
            required: false,
          },
          {
            model: UserKycDocuments,
            as: "kyc_documents",
            attributes: ["address", "document_type", "document_path", "status"],
            required: false,
          },
          {
            model: User,
            as: "ngo",
            attributes: ["name"],
            required: false,
          }
        ],
        order: [["created_at", "DESC"]],
      });
       const data = users.rows.map((user) => {
                      const userData = user.toJSON();
                      if (userData.kyc_documents?.document_path) {
                          console.log("User KYC document path:", userData.kyc_documents.document_path);
                          userData.kyc_documents.document_path = `${process.env.BASE_URL}/uploads/kyc/${path.basename(userData.kyc_documents.document_path)}`;     
                      }
                      return userData;
                  });
      return callback(null, {
        data: {
          rows: data,
          total: users.count,
          currentPage: Number(page),
          totalPages: Math.ceil(users.count / limit),
        },
      });
    } catch (error) {
      console.error("Error in listUsers:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("LIST_USERS_FAILED"));
    }
  }
  static async changeUserStatus(request, callback) {
    try {
      const { id, status } = request.payload;
      const user = await User.findOne({
        where: { id, role: "USER" },
      });
      if (!user) {
        return callback(new Error("USER_NOT_FOUND"));
      }
      user.is_active = status === "active";
      await user.save();
      return callback(null, {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          is_active: user.is_active,
        },
      });
    } catch (error) {
      console.error("Error in changeUserStatus:", error);
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("CHANGE_USER_STATUS_FAILED"));
    }
  }
}
