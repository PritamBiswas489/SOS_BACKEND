import "../config/environment.js";
import db from "../databases/models/index.js";
const { Op, User, Licenses, UserKycDocuments, SosSessions, SosSessionAudioRecords, AppFeedback, AppFeedbackAttachments, RequestIosEmail, ContactAdmin, EmergencyServices, AbuserReports, Abusers, AbuserReportEvidenceFiles , SosSessionNotifications} = db;
import { hashStr, compareHashedStr, generateToken } from "../libraries/auth.js";
import { randomSaltHex, getProfileImage, audioFileLink } from "../libraries/utility.js";
import * as Sentry from "@sentry/node";
const path = await import("path");
const fs = await import("fs");
import logger from "../config/winston.js";
import { NGO_Approved, NGO_Rejected, sendLicenseKeyAfterAdminApproval, sendAppFeedbackReplyEmail, sendRequestIosAccessReplyEmail, sendContactAdminReplyEmail } from "./email.service.js";

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
      logger.error("ERROR In registerAdmin", { error: error });
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
      logger.error("ERROR In loginAdminUser", { error: error });
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
      logger.error("ERROR In listNgos", { error: error });
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
      NGO_Approved(ngo.id);
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
      NGO_Rejected(ngo.id);
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
      logger.error("ERROR In rejectNgo", { error: error });
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
      logger.error("ERROR In changeNgoStatus", { error: error });
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
      logger.error("ERROR In upgradeNgoUserLimit", { error: error });
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
      logger.error("ERROR In getNgoAutocompleteByName", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("GET_NGO_AUTOCOMPLETE_FAILED"));
    }
  }

  static async getUserAutocomplete(request, callback) {
    try {
      const { search } = request.payload;
      const users = await User.findAll({
        where: {
          role: "USER",
          [Op.or]: [
            { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { phone_number: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          ],
        },
        attributes: ["id", "name", "email", "phone_number", "profile_photo", 'role'],
        limit: 10,
      });
      return callback(null, { data: users });
    } catch (error) {
      console.error("Error in getUserAutocomplete:", error);
      logger.error("ERROR In getUserAutocomplete", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("GET_USER_AUTOCOMPLETE_FAILED"));
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
          currentPage: Number(page),
          totalPages: Math.ceil(users.count / limit),
        },
      });
    } catch (error) {
      console.error("Error in listUsers:", error);
      logger.error("ERROR In listUsers", { error: error });
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
      logger.error("ERROR In changeUserStatus", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("CHANGE_USER_STATUS_FAILED"));
    }
  }
  static async getPendingKycDocuments(request, callback) {
    try {
      const { payload, headers } = request;
      const limit = payload.limit || 10;
      const page = payload.page || 1;
      const offset = (page - 1) * limit;
      const pendingKycDocuments = await UserKycDocuments.findAndCountAll({
        where: { status: "pending" },
        limit: Number(limit),
        offset: Number(offset),
        order: [["created_at", "DESC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "phone_number"],
          },
        ],
      });
      const data = pendingKycDocuments.rows.map((doc) => {
        const docData = doc.toJSON();
        if (docData.document_path) {
          docData.document_path = `${process.env.BASE_URL}/uploads/kyc/${path.basename(docData.document_path)}`;
        }
        return docData;
      });
      return callback(null, {
        data: {
          rows: data,
          total: pendingKycDocuments.count,
          currentPage: Number(page),
          totalPages: Math.ceil(pendingKycDocuments.count / limit),
        },
      });
    } catch (error) {
      console.error("Error in getPendingKycDocuments:", error);
      logger.error("ERROR In getPendingKycDocuments", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("GET_PENDING_KYC_DOCUMENTS_FAILED"));
    }
  }
  static async changeKycDocumentStatus(request, callback) {
    const transaction = await db.sequelize.transaction();
    try {
      const { id, status } = request.payload;

      // Bug 1 fixed: transaction is part of the single options object, not a second arg
      const kycDocument = await UserKycDocuments.findOne({
        where: { id },
        transaction,
        lock: transaction.LOCK.UPDATE, // also add a lock since we're about to mutate
      });



      // Bug 2 fixed: rollback before returning
      if (!kycDocument) {
        await transaction.rollback();
        return callback(new Error("KYC_DOCUMENT_NOT_FOUND"));
      }

      kycDocument.status = status;
      await kycDocument.save({ transaction });

      // Bug 3 fixed: handle both branches — commit always happens
      if (status === "approved") {
        // Bug 4 fixed: use actual ngo_id instead of hardcoded "00"
        const ngoId = kycDocument.ngo_id; // ensure this field exists on the document
        const licenseNumber = `KBY-${(String(kycDocument.user_id).length > 6 ? '1' : String(kycDocument.user_id)).padStart(6, "0")}`;
        await Licenses.destroy({ where: { user_id: kycDocument.user_id }, transaction });
        const license = await Licenses.create(
          {
            user_id: kycDocument.user_id,
            license_key: licenseNumber,
            status: "active",
          },
          { transaction },
        );

        if (!license) {
          await transaction.rollback();
          return callback(new Error("LICENSE_CREATION_FAILED"));
        }

        await User.update(
          { name: kycDocument.name },
          { where: { id: kycDocument.user_id }, transaction },
        );

        await transaction.commit();
        return callback(null, { data: { document: kycDocument, license } });
      } else if (status === "rejected") {
        await Licenses.destroy({ where: { user_id: kycDocument.user_id }, transaction });
      }

      // Bug 3 fixed: non-approved path (rejected, pending, etc.) also commits
      await transaction.commit();
      return callback(null, { data: { document: kycDocument } });
    } catch (error) {
      // Bug 5 fixed: guard against double-rollback after a commit
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error("Error in changeKycDocumentStatus:", error);
      logger.error("ERROR In changeKycDocumentStatus", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("CHANGE_KYC_DOCUMENT_STATUS_FAILED"));
    }
  }

  static async listSos({ payload }, callback) {
    try {
      const {
        ngo_id,
        limit = 10,
        page = 1,
        status,
        mobileNumber,
        phoneNumber,
        fromDate,
        toDate,
      } = payload;

      const parsedLimit = Number(limit) || 10;
      const parsedPage = Number(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const sosWhere = {};
      const allowedStatuses = ["active", "expired", "cancelled", "resolved"];
      if (status) {
        if (!allowedStatuses.includes(status)) {
          return callback(new Error("INVALID_STATUS_FILTER"));
        }
        sosWhere.status = status;
      }

      const createdAtFilter = {};
      if (fromDate) {
        const parsedFromDate = new Date(fromDate);
        if (Number.isNaN(parsedFromDate.getTime())) {
          return callback(new Error("INVALID_FROM_DATE"));
        }
        parsedFromDate.setHours(0, 0, 0, 0);
        createdAtFilter[Op.gte] = parsedFromDate;
      }

      if (toDate) {
        const parsedToDate = new Date(toDate);
        if (Number.isNaN(parsedToDate.getTime())) {
          return callback(new Error("INVALID_TO_DATE"));
        }
        parsedToDate.setHours(23, 59, 59, 999);
        createdAtFilter[Op.lte] = parsedToDate;
      }

      if (fromDate && toDate && createdAtFilter[Op.gte] > createdAtFilter[Op.lte]) {
        return callback(new Error("INVALID_DATE_RANGE"));
      }

      if (Object.keys(createdAtFilter).length > 0) {
        sosWhere.created_at = createdAtFilter;
      }

      const userWhere = { role: "USER" };
      if (ngo_id) {
        userWhere.ngo_id = ngo_id;
      }
      if (mobileNumber || phoneNumber) {
        userWhere.phone_number = mobileNumber || phoneNumber;
      }

      const response = await SosSessions.findAndCountAll({
        distinct: true,
        where: sosWhere,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "phone_number", "profile_photo", "ngo_id"],
            where: userWhere,
            required: true,
          },
          {
            model: SosSessionAudioRecords,
            as: "audio_records",
            attributes: ["id", "file_name", "created_at"],
            required: false,
          },
           {
            model: SosSessionNotifications,
            as: "notifications",
            include: [
              {
                model: User,
                as: "to_user",
                attributes: ["id", "name", "phone_number","profile_photo"],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parsedLimit,
        offset,
      });

      const rows = response.rows.map((session) => {
        const plain = session.toJSON();
        const photo = plain?.user?.profile_photo
          ? `${process.env.IMAGE_BASE_URL}${plain.user.profile_photo}`
          : null;

        if (photo) {
          plain.user.profile_photo = getProfileImage(photo);
        }

        plain.audio_records = (plain.audio_records || []).map((audioRecord) => ({
          ...audioRecord,
          file_url: audioFileLink(audioRecord.file_name),
        }));
        plain.notifications = (plain.notifications || []).map((notificationPlain) => {
          
          const toUserPhoto = notificationPlain?.to_user?.profile_photo
            ? `${process.env.IMAGE_BASE_URL}${notificationPlain.to_user.profile_photo}`
            : null;

          if (toUserPhoto) {
            notificationPlain.to_user.profile_photo = getProfileImage(toUserPhoto);
          }

          return notificationPlain;
        });

        return plain;
      });

      return callback(null, {
        data: {
          rows,
          total: response.count,
          currentPage: parsedPage,
          totalPages: Math.ceil(response.count / parsedLimit),
        },
      });
    } catch (error) {
      console.error("Error in listSos:", error);
      logger.error("ERROR In listSos", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("LIST_SOS_FOR_ADMIN_FAILED"));
    }
  }

  static async listAppFeedback({ payload }, callback) {
    try {
      const {
        limit = 10,
        page = 1,
        status,
        user_id,
        fromDate,
        toDate,
      } = payload;

      const parsedLimit = Number(limit) || 10;
      const parsedPage = Number(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const whereClause = {};
      const allowedStatuses = ["new", "reviewed", "resolved", "ignored"];

      if (status) {
        if (!allowedStatuses.includes(status)) {
          return callback(new Error("INVALID_STATUS_FILTER"));
        }
        whereClause.status = status;
      }

      if (user_id) {
        whereClause.user_id = Number(user_id);
      }

      const createdAtFilter = {};

      if (fromDate) {
        const parsedFromDate = new Date(fromDate);
        if (Number.isNaN(parsedFromDate.getTime())) {
          return callback(new Error("INVALID_FROM_DATE"));
        }
        parsedFromDate.setHours(0, 0, 0, 0);
        createdAtFilter[Op.gte] = parsedFromDate;
      }

      if (toDate) {
        const parsedToDate = new Date(toDate);
        if (Number.isNaN(parsedToDate.getTime())) {
          return callback(new Error("INVALID_TO_DATE"));
        }
        parsedToDate.setHours(23, 59, 59, 999);
        createdAtFilter[Op.lte] = parsedToDate;
      }

      if (fromDate && toDate && createdAtFilter[Op.gte] > createdAtFilter[Op.lte]) {
        return callback(new Error("INVALID_DATE_RANGE"));
      }

      if (Object.keys(createdAtFilter).length > 0) {
        whereClause.created_at = createdAtFilter;
      }

      const feedback = await AppFeedback.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "phone_number", "profile_photo"],
            required: false,
          },
          {
            model: AppFeedbackAttachments,
            as: "feedback_files",
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parsedLimit,
        offset,
        distinct: true,
      });

      const rows = feedback.rows.map((item) => {
        const plain = item.toJSON();

        const photo = plain?.user?.profile_photo
          ? `${process.env.IMAGE_BASE_URL}${plain.user.profile_photo}`
          : null;
        if (photo && plain?.user) {
          plain.user.profile_photo = getProfileImage(photo);
        }

        plain.feedback_files = (plain.feedback_files || []).map((file) => {
          if (!file?.file_url) {
            return {
              ...file,
              file_url: null,
            };
          }

          const normalizedPath = file.file_url.startsWith("/")
            ? file.file_url
            : `/${file.file_url}`;
          const absolutePath = path.join(
            process.cwd(),
            normalizedPath.replace(/^\//, ""),
          );

          if (!fs.existsSync(absolutePath)) {
            return {
              ...file,
              file_url: null,
            };
          }

          return {
            ...file,
            file_url: `${process.env.BASE_URL}${normalizedPath}`,
          };
        });
        return plain;
      });

      return callback(null, {
        data: {
          rows,
          total: feedback.count,
          currentPage: parsedPage,
          totalPages: Math.ceil(feedback.count / parsedLimit),
        },
      });
    } catch (error) {
      console.error("Error in listAppFeedback:", error);
      logger.error("ERROR In listAppFeedback", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("LIST_APP_FEEDBACK_FAILED"));
    }
  }

  static async replyAppFeedback({ payload }, callback) {
    try {
      const { feedback_id, message } = payload;

      const feedback = await AppFeedback.findByPk(feedback_id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      });

      if (!feedback) {
        return callback(new Error("APP_FEEDBACK_NOT_FOUND"));
      }

      const userEmail = feedback?.user?.email;
      if (!userEmail) {
        return callback(new Error("FEEDBACK_USER_EMAIL_NOT_FOUND"));
      }

      await sendAppFeedbackReplyEmail({
        to: userEmail,
        userName: feedback?.user?.name,
        message,
        feedbackId: feedback.id,
      });

      // await feedback.update({
      //   admin_reply: message,
      //   status: "resolved",
      //   updated_at: new Date(),
      // });

      return callback(null, {
        data: {
          id: feedback.id,
          admin_reply: message,
          replied_to: userEmail,
        },
      });
    } catch (error) {
      console.error("Error in replyAppFeedback:", error);
      logger.error("ERROR In replyAppFeedback", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("REPLY_APP_FEEDBACK_FAILED"));
    }
  }

  static async updateAppFeedbackStatus({ payload }, callback) {
    try {
      const { feedback_id, status } = payload;

      const feedback = await AppFeedback.findByPk(feedback_id);
      if (!feedback) {
        return callback(new Error("APP_FEEDBACK_NOT_FOUND"));
      }

      feedback.status = status;
      feedback.updated_at = new Date();
      await feedback.save();

      return callback(null, {
        data: {
          id: feedback.id,
          status: feedback.status,
          updated_at: feedback.updated_at,
        },
      });
    } catch (error) {
      console.error("Error in updateAppFeedbackStatus:", error);
      logger.error("ERROR In updateAppFeedbackStatus", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("UPDATE_APP_FEEDBACK_STATUS_FAILED"));
    }
  }

  static async listRequestIosAccess({ payload }, callback) {
    try {
      const { user_id, mobileNumber, testFlightEmail, status, limit = 10, page = 1 } = payload;

      const parsedLimit = Number(limit) || 10;
      const parsedPage = Number(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const whereClause = {};
      if (user_id) {
        whereClause.userId = Number(user_id);
      }
      if (testFlightEmail) {
        whereClause.testFlightEmail = { [Op.iLike]: `%${testFlightEmail}%` };
      }
      if (status) {
        whereClause.status = status;
      }

      const userWhere = {};
      if (mobileNumber) {
        userWhere.phone_number = { [Op.iLike]: `%${mobileNumber}%` };
      }

      const response = await RequestIosEmail.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phone_number"],
            where: userWhere,
            required: Boolean(mobileNumber),
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parsedLimit,
        offset,
      });

      const rows = response.rows.map((item) => item.toJSON());

      return callback(null, {
        data: {
          rows,
          total: response.count,
          currentPage: parsedPage,
          totalPages: Math.ceil(response.count / parsedLimit),
        },
      });
    } catch (error) {
      console.error("Error in listRequestIosAccess:", error);
      logger.error("ERROR In listRequestIosAccess", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("LIST_REQUEST_IOS_ACCESS_FAILED"));
    }
  }

  static async changeRequestIosAccessStatus({ payload }, callback) {
    try {
      const { id, status } = payload;

      const request = await RequestIosEmail.findByPk(id);
      if (!request) {
        return callback(new Error("REQUEST_IOS_ACCESS_NOT_FOUND"));
      }

      request.status = status;
      request.updatedAt = new Date();
      await request.save();

      return callback(null, {
        data: {
          id: request.id,
          userId: request.userId,
          testFlightEmail: request.testFlightEmail,
          status: request.status,
          updatedAt: request.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in changeRequestIosAccessStatus:", error);
      logger.error("ERROR In changeRequestIosAccessStatus", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("CHANGE_REQUEST_IOS_ACCESS_STATUS_FAILED"));
    }
  }

  static async updateEmailForIosAccessRequest({ payload }, callback) {
    try {
      const { id, testFlightEmail } = payload;

      const request = await RequestIosEmail.findByPk(id);
      if (!request) {
        return callback(new Error("REQUEST_IOS_ACCESS_NOT_FOUND"));
      }

      request.testFlightEmail = testFlightEmail;
      request.updatedAt = new Date();
      await request.save();

      return callback(null, {
        data: {
          id: request.id,
          userId: request.userId,
          testFlightEmail: request.testFlightEmail,
          status: request.status,
          updatedAt: request.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in updateEmailForIosAccessRequest:", error);
      logger.error("ERROR In updateEmailForIosAccessRequest", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("UPDATE_EMAIL_FOR_IOS_ACCESS_REQUEST_FAILED"));
    }
  }

  static async replyRequestIosAccess({ payload }, callback) {
    try {
      const { request_id, message } = payload;

      const request = await RequestIosEmail.findByPk(request_id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      });

      if (!request) {
        return callback(new Error("REQUEST_IOS_ACCESS_NOT_FOUND"));
      }

      const userEmail = request?.user?.email;
      if (!userEmail) {
        return callback(new Error("REQUEST_IOS_ACCESS_USER_EMAIL_NOT_FOUND"));
      }

      await sendRequestIosAccessReplyEmail({
        to: userEmail,
        userName: request?.user?.name,
        message,
        requestId: request.id,
      });

      return callback(null, {
        data: {
          request_id: request.id,
          replied_to: userEmail,
          message,
        },
      });
    } catch (error) {
      console.error("Error in replyRequestIosAccess:", error);
      logger.error("ERROR In replyRequestIosAccess", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("REPLY_REQUEST_IOS_ACCESS_FAILED"));
    }
  }

  static async requestForIosAccess({ userId, payload }, callback) {
    try {
      // Here you can implement the logic to handle the iOS access request.
      // For example, you might want to log the request or send an email to the admin.
      const checkExistingRequest = await RequestIosEmail.findOne({ where: { userId: userId } });
      if (checkExistingRequest) {
        return callback(null, { data: { message: "iOS access request already submitted." } });
      }
      const request = await RequestIosEmail.create({
        userId: userId,
        testFlightEmail: payload?.emailAddress,
        status: "new",
      });
      return callback(null, { data: { message: "iOS access request submitted successfully." } });
    } catch (error) {
      console.error("Error in requestForIosAccess:", error);
      logger.error("ERROR In requestForIosAccess", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("REQUEST_IOS_ACCESS_FAILED"));
    }
  }

  static async getStatusOfIosAccessRequest({ userId }, callback) {
    try {
      if (!userId) {
        return callback(new Error("USER_NOT_FOUND"));
      }

      const request = await RequestIosEmail.findOne({
        where: { userId: Number(userId) },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "userId", "testFlightEmail", "status", "createdAt", "updatedAt"],
      });

      if (!request) {
        return callback(null, {
          data: {
            hasRequest: false,
            request: null,
          },
        });
      }

      return callback(null, {
        data: {
          hasRequest: true,
          request: request.toJSON(),
        },
      });
    } catch (error) {
      console.error("Error in getStatusOfIosAccessRequest:", error);
      logger.error("ERROR In getStatusOfIosAccessRequest", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("GET_STATUS_OF_IOS_ACCESS_REQUEST_FAILED"));
    }
  }

  static async contactAdmin({ userId, payload }, callback) {
    try {
      if (!userId) {
        return callback(new Error("USER_NOT_FOUND"));
      }

      const record = await ContactAdmin.create({
        userId: Number(userId),
        message: payload?.message,
      });

      return callback(null, {
        data: {
          id: record.id,
          message: record.message,
          userId: record.userId,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in contactAdmin:", error);
      logger.error("ERROR In contactAdmin", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("CONTACT_ADMIN_FAILED"));
    }
  }

  static async listContactAdmin({ payload }, callback) {
    try {
      const {
        userId,
        user_id,
        mobileNumber,
        fromDate,
        toDate,
        limit = 10,
        page = 1,
      } = payload;

      const normalizedUserId = userId || user_id;
      const parsedLimit = Number(limit) || 10;
      const parsedPage = Number(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const whereClause = {};
      if (normalizedUserId) {
        whereClause.userId = Number(normalizedUserId);
      }

      const createdAtFilter = {};

      if (fromDate) {
        const parsedFromDate = new Date(fromDate);
        if (Number.isNaN(parsedFromDate.getTime())) {
          return callback(new Error("INVALID_FROM_DATE"));
        }
        parsedFromDate.setHours(0, 0, 0, 0);
        createdAtFilter[Op.gte] = parsedFromDate;
      }

      if (toDate) {
        const parsedToDate = new Date(toDate);
        if (Number.isNaN(parsedToDate.getTime())) {
          return callback(new Error("INVALID_TO_DATE"));
        }
        parsedToDate.setHours(23, 59, 59, 999);
        createdAtFilter[Op.lte] = parsedToDate;
      }

      if (fromDate && toDate && createdAtFilter[Op.gte] > createdAtFilter[Op.lte]) {
        return callback(new Error("INVALID_DATE_RANGE"));
      }

      if (Object.keys(createdAtFilter).length > 0) {
        whereClause.createdAt = createdAtFilter;
      }

      const userWhere = {};
      if (mobileNumber) {
        userWhere.phone_number = { [Op.iLike]: `%${mobileNumber}%` };
      }

      const response = await ContactAdmin.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phone_number"],
            where: userWhere,
            required: Boolean(mobileNumber),
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parsedLimit,
        offset,
      });

      const rows = response.rows.map((item) => item.toJSON());

      return callback(null, {
        data: {
          rows,
          total: response.count,
          currentPage: parsedPage,
          totalPages: Math.ceil(response.count / parsedLimit),
        },
      });
    } catch (error) {
      console.error("Error in listContactAdmin:", error);
      logger.error("ERROR In listContactAdmin", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("LIST_CONTACT_ADMIN_FAILED"));
    }
  }

  static async replyContactAdmin({ payload }, callback) {
    try {
      const { contact_id, message } = payload;

      const contact = await ContactAdmin.findByPk(contact_id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      });

      if (!contact) {
        return callback(new Error("CONTACT_ADMIN_NOT_FOUND"));
      }

      const userEmail = contact?.user?.email;
      if (!userEmail) {
        return callback(new Error("CONTACT_ADMIN_USER_EMAIL_NOT_FOUND"));
      }

      await sendContactAdminReplyEmail({
        to: userEmail,
        userName: contact?.user?.name,
        message,
        contactId: contact.id,
      });

      return callback(null, {
        data: {
          contact_id: contact.id,
          replied_to: userEmail,
          message,
        },
      });
    } catch (error) {
      console.error("Error in replyContactAdmin:", error);
      logger.error("ERROR In replyContactAdmin", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("REPLY_CONTACT_ADMIN_FAILED"));
    }
  }

  static async listEmergencyServicesLocation({ payload }, callback) {
    try {
      const {
        requestBy,
        userId,
        serviceType,
        status,
        phoneNumber,
        mobileNumber,
        placeId,
        locationName,
        fromDate,
        toDate,
        limit = 10,
        page = 1,
      } = payload;

      const normalizedRequestBy = requestBy || userId;
      const normalizedPhoneNumber = phoneNumber || mobileNumber;
      const parsedLimit = Number(limit) || 10;
      const parsedPage = Number(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const whereClause = {};

      if (normalizedRequestBy) {
        whereClause.requestBy = Number(normalizedRequestBy);
      }
      if (serviceType) {
        whereClause.serviceType = { [Op.iLike]: `%${serviceType}%` };
      }
      if (status) {
        whereClause.status = status;
      }
      if (normalizedPhoneNumber) {
        whereClause.phoneNumber = { [Op.iLike]: `%${normalizedPhoneNumber}%` };
      }
      if (placeId) {
        whereClause.placeId = { [Op.iLike]: `%${placeId}%` };
      }
      if (locationName) {
        whereClause.locationName = { [Op.iLike]: `%${locationName}%` };
      }

      const createdAtFilter = {};

      if (fromDate) {
        const parsedFromDate = new Date(fromDate);
        if (Number.isNaN(parsedFromDate.getTime())) {
          return callback(new Error("INVALID_FROM_DATE"));
        }
        parsedFromDate.setHours(0, 0, 0, 0);
        createdAtFilter[Op.gte] = parsedFromDate;
      }

      if (toDate) {
        const parsedToDate = new Date(toDate);
        if (Number.isNaN(parsedToDate.getTime())) {
          return callback(new Error("INVALID_TO_DATE"));
        }
        parsedToDate.setHours(23, 59, 59, 999);
        createdAtFilter[Op.lte] = parsedToDate;
      }

      if (fromDate && toDate && createdAtFilter[Op.gte] > createdAtFilter[Op.lte]) {
        return callback(new Error("INVALID_DATE_RANGE"));
      }

      if (Object.keys(createdAtFilter).length > 0) {
        whereClause.createdAt = createdAtFilter;
      }

      const response = await EmergencyServices.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phone_number", "role"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parsedLimit,
        offset,
      });

      const rows = response.rows.map((item) => item.toJSON());

      return callback(null, {
        data: {
          rows,
          total: response.count,
          currentPage: parsedPage,
          totalPages: Math.ceil(response.count / parsedLimit),
        },
      });
    } catch (error) {
      console.error("Error in listEmergencyServicesLocation:", error);
      logger.error("ERROR In listEmergencyServicesLocation", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("LIST_EMERGENCY_SERVICES_LOCATION_FAILED"));
    }
  }

  static async changeEmergencyServicesLocationStatus({ payload }, callback) {
    try {
      const { id, status } = payload;

      const emergencyService = await EmergencyServices.findByPk(id);
      if (!emergencyService) {
        return callback(new Error("EMERGENCY_SERVICE_LOCATION_NOT_FOUND"));
      }

      emergencyService.status = status;
      emergencyService.updatedAt = new Date();
      await emergencyService.save();

      return callback(null, {
        data: {
          id: emergencyService.id,
          status: emergencyService.status,
          updatedAt: emergencyService.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in changeEmergencyServicesLocationStatus:", error);
      logger.error("ERROR In changeEmergencyServicesLocationStatus", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("CHANGE_EMERGENCY_SERVICES_LOCATION_STATUS_FAILED"));
    }
  }

  static async getAbuseReportList({ payload }, callback) {
    try {
      const {
        userId,
        user_id,
        abuserId,
        abuser_id,
        abuseType,
        threatLevel,
        history_of_violence,
        weapon_access,
        restraining_order,
        userName,
        mobileNumber,
        abuserName,
        abuserPhone,
        abuserEmail,
        incidentFromDate,
        incidentToDate,
        fromDate,
        toDate,
        limit = 10,
        page = 1,
      } = payload;

      const normalizedUserId = userId || user_id;
      const normalizedAbuserId = abuserId || abuser_id;
      const parsedLimit = Number(limit) || 10;
      const parsedPage = Number(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const whereClause = {};

      if (normalizedUserId) {
        whereClause.user_id = Number(normalizedUserId);
      }
      if (normalizedAbuserId) {
        whereClause.abuser_id = Number(normalizedAbuserId);
      }
      if (abuseType) {
        whereClause.abuse_type = { [Op.iLike]: `%${abuseType}%` };
      }
      if (threatLevel) {
        whereClause.threat_level = threatLevel;
      }
      if (history_of_violence !== undefined) {
        whereClause.history_of_violence = history_of_violence;
      }
      if (weapon_access !== undefined) {
        whereClause.weapon_access = weapon_access;
      }
      if (restraining_order !== undefined) {
        whereClause.restraining_order = restraining_order;
      }

      const incidentDateFilter = {};
      if (incidentFromDate) {
        const parsedIncidentFromDate = new Date(incidentFromDate);
        if (Number.isNaN(parsedIncidentFromDate.getTime())) {
          return callback(new Error("INVALID_INCIDENT_FROM_DATE"));
        }
        parsedIncidentFromDate.setHours(0, 0, 0, 0);
        incidentDateFilter[Op.gte] = parsedIncidentFromDate;
      }
      if (incidentToDate) {
        const parsedIncidentToDate = new Date(incidentToDate);
        if (Number.isNaN(parsedIncidentToDate.getTime())) {
          return callback(new Error("INVALID_INCIDENT_TO_DATE"));
        }
        parsedIncidentToDate.setHours(23, 59, 59, 999);
        incidentDateFilter[Op.lte] = parsedIncidentToDate;
      }
      if (incidentFromDate && incidentToDate && incidentDateFilter[Op.gte] > incidentDateFilter[Op.lte]) {
        return callback(new Error("INVALID_INCIDENT_DATE_RANGE"));
      }
      if (Object.keys(incidentDateFilter).length > 0) {
        whereClause.incident_date = incidentDateFilter;
      }

      const createdAtFilter = {};
      if (fromDate) {
        const parsedFromDate = new Date(fromDate);
        if (Number.isNaN(parsedFromDate.getTime())) {
          return callback(new Error("INVALID_FROM_DATE"));
        }
        parsedFromDate.setHours(0, 0, 0, 0);
        createdAtFilter[Op.gte] = parsedFromDate;
      }
      if (toDate) {
        const parsedToDate = new Date(toDate);
        if (Number.isNaN(parsedToDate.getTime())) {
          return callback(new Error("INVALID_TO_DATE"));
        }
        parsedToDate.setHours(23, 59, 59, 999);
        createdAtFilter[Op.lte] = parsedToDate;
      }
      if (fromDate && toDate && createdAtFilter[Op.gte] > createdAtFilter[Op.lte]) {
        return callback(new Error("INVALID_DATE_RANGE"));
      }
      if (Object.keys(createdAtFilter).length > 0) {
        whereClause.created_at = createdAtFilter;
      }

      const userWhere = {};
      if (userName) {
        userWhere.name = { [Op.iLike]: `%${userName}%` };
      }
      if (mobileNumber) {
        userWhere.phone_number = { [Op.iLike]: `%${mobileNumber}%` };
      }

      const abuserWhere = {};
      if (abuserName) {
        abuserWhere.full_name = { [Op.iLike]: `%${abuserName}%` };
      }
      if (abuserPhone) {
        abuserWhere.phone = { [Op.iLike]: `%${abuserPhone}%` };
      }
      if (abuserEmail) {
        abuserWhere.email = { [Op.iLike]: `%${abuserEmail}%` };
      }

      const response = await AbuserReports.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phone_number", "role", "profile_photo"],
            where: userWhere,
            required: Object.keys(userWhere).length > 0,
          },
          {
            model: Abusers,
            as: "abuser",
            attributes: ["id", "user_id", "full_name", "alias_name", "gender", "dob", "phone", "email", "address", "photo", "created_at", "updated_at"],
            where: abuserWhere,
            required: Object.keys(abuserWhere).length > 0,
          },
          {
            model: AbuserReportEvidenceFiles,
            as: "evidence_files",
            attributes: ["id", "report_id", "file_type", "file_url", "created_at"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parsedLimit,
        offset,
        distinct: true,
      });

      const rows = response.rows.map((item) => {
        const plain = item.toJSON();

        if (plain?.abuser?.photo) {
          const normalizedPhotoPath = plain.abuser.photo.startsWith("/")
            ? plain.abuser.photo
            : `/${plain.abuser.photo}`;
          const absolutePhotoPath = path.join(
            process.cwd(),
            normalizedPhotoPath.replace(/^\//, ""),
          );



          plain.abuser.photo = fs.existsSync(absolutePhotoPath)
            ? `${process.env.BASE_URL}${normalizedPhotoPath}`
            : null;
        }

        const usrPhoto = plain?.user?.profile_photo
          ? `${process.env.IMAGE_BASE_URL}${plain.user.profile_photo}`
          : null;
        if (usrPhoto) {
          plain.user.profile_photo = getProfileImage(usrPhoto);
        }

        plain.evidence_files = (plain.evidence_files || []).map((file) => {
          if (!file?.file_url) {
            return {
              ...file,
              file_url: null,
            };
          }

          const normalizedPath = file.file_url.startsWith("/")
            ? file.file_url
            : `/${file.file_url}`;
          const absolutePath = path.join(
            process.cwd(),
            normalizedPath.replace(/^\//, ""),
          );

          return {
            ...file,
            file_url: fs.existsSync(absolutePath)
              ? `${process.env.BASE_URL}${normalizedPath}`
              : null,
          };
        });

        return plain;
      });

      return callback(null, {
        data: {
          rows,
          total: response.count,
          currentPage: parsedPage,
          totalPages: Math.ceil(response.count / parsedLimit),
        },
      });
    } catch (error) {
      console.error("Error in getAbuseReportList:", error);
      logger.error("ERROR In getAbuseReportList", { error: error });
      process.env.NODE_ENV === "production" && Sentry.captureException(error);
      return callback(new Error("GET_ABUSE_REPORT_LIST_FAILED"));
    }
  }
  static async getAbusersWithReportStats({ payload }, callback) {
    try {
      const {
        abuser_id,
        abuserId,
        full_name,
        alias_name,
        gender,
        phone,
        email,
        abuse_type,
        abuseType,
        threat_level,
        threatLevel,
        history_of_violence,
        weapon_access,
        restraining_order,
        incidentFromDate,
        incidentToDate,
        fromDate,
        toDate,
        limit = 10,
        page = 1,
        user_id,
        userId,
        userName,
        mobileNumber,
      } = payload || {};

      const parsedLimit = Number(limit) || 10;
      const parsedPage = Number(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const normalizedAbuserId = abuserId || abuser_id;
      const normalizedUserId = userId || user_id;

      const abuserWhere = {};
      if (normalizedAbuserId) {
        abuserWhere.id = Number(normalizedAbuserId);
      }
      if (full_name) {
        abuserWhere.full_name = { [Op.iLike]: `%${full_name}%` };
      }
      if (alias_name) {
        abuserWhere.alias_name = { [Op.iLike]: `%${alias_name}%` };
      }
      if (gender) {
        abuserWhere.gender = gender;
      }
      if (phone) {
        abuserWhere.phone = { [Op.iLike]: `%${phone}%` };
      }
      if (email) {
        abuserWhere.email = { [Op.iLike]: `%${email}%` };
      }

      const victimWhere = {};
      if (normalizedUserId) {
        victimWhere.id = Number(normalizedUserId);
      }
      if (userName) {
        victimWhere.name = { [Op.iLike]: `%${userName}%` };
      }
      if (mobileNumber) {
        victimWhere.phone_number = { [Op.iLike]: `%${mobileNumber}%` };
      }

      const reportWhere = {};
      if (abuse_type || abuseType) {
        reportWhere.abuse_type = { [Op.iLike]: `%${abuse_type || abuseType}%` };
      }
      if (threat_level || threatLevel) {
        reportWhere.threat_level = threat_level || threatLevel;
      }
      if (history_of_violence !== undefined) {
        reportWhere.history_of_violence = history_of_violence;
      }
      if (weapon_access !== undefined) {
        reportWhere.weapon_access = weapon_access;
      }
      if (restraining_order !== undefined) {
        reportWhere.restraining_order = restraining_order;
      }

      const incidentDateFilter = {};
      if (incidentFromDate) {
        const parsedIncidentFromDate = new Date(incidentFromDate);
        if (Number.isNaN(parsedIncidentFromDate.getTime())) {
          return callback(new Error("INVALID_INCIDENT_FROM_DATE"));
        }
        parsedIncidentFromDate.setHours(0, 0, 0, 0);
        incidentDateFilter[Op.gte] = parsedIncidentFromDate;
      }
      if (incidentToDate) {
        const parsedIncidentToDate = new Date(incidentToDate);
        if (Number.isNaN(parsedIncidentToDate.getTime())) {
          return callback(new Error("INVALID_INCIDENT_TO_DATE"));
        }
        parsedIncidentToDate.setHours(23, 59, 59, 999);
        incidentDateFilter[Op.lte] = parsedIncidentToDate;
      }
      if (incidentFromDate && incidentToDate && incidentDateFilter[Op.gte] > incidentDateFilter[Op.lte]) {
        return callback(new Error("INVALID_INCIDENT_DATE_RANGE"));
      }
      if (Object.keys(incidentDateFilter).length > 0) {
        reportWhere.incident_date = incidentDateFilter;
      }

      const createdAtFilter = {};
      if (fromDate) {
        const parsedFromDate = new Date(fromDate);
        if (Number.isNaN(parsedFromDate.getTime())) {
          return callback(new Error("INVALID_FROM_DATE"));
        }
        parsedFromDate.setHours(0, 0, 0, 0);
        createdAtFilter[Op.gte] = parsedFromDate;
      }
      if (toDate) {
        const parsedToDate = new Date(toDate);
        if (Number.isNaN(parsedToDate.getTime())) {
          return callback(new Error("INVALID_TO_DATE"));
        }
        parsedToDate.setHours(23, 59, 59, 999);
        createdAtFilter[Op.lte] = parsedToDate;
      }
      if (fromDate && toDate && createdAtFilter[Op.gte] > createdAtFilter[Op.lte]) {
        return callback(new Error("INVALID_DATE_RANGE"));
      }
      if (Object.keys(createdAtFilter).length > 0) {
        reportWhere.created_at = createdAtFilter;
      }

      const abusers = await Abusers.findAndCountAll({
        distinct: true,
        where: abuserWhere,
        include: [
          {
            model: AbuserReports,
            as: "reports",
            where: reportWhere,
            required:
              Object.keys(victimWhere).length > 0 ||
              Object.keys(reportWhere).length > 0,
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "email", "phone_number", "profile_photo"],
                where: victimWhere,
                required: Object.keys(victimWhere).length > 0,
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parsedLimit,
        offset,
      });

      const result = [];

      for (const abuser of abusers.rows) {
        const reports = abuser.reports || [];
        const victims = reports.map((r) => r.user).filter(Boolean);

        // dedupe victims (same user may report the same abuser more than once)
        const uniqueVictims = Array.from(
          new Map(victims.map((v) => [v.id, v])).values(),
        ).map((victim) => {
          const victimPlain = victim.toJSON();
          const victimPhoto = victimPlain?.profile_photo
            ? `${process.env.IMAGE_BASE_URL}${victimPlain.profile_photo}`
            : null;

          return {
            ...victimPlain,
            profile_photo: victimPhoto ? getProfileImage(victimPhoto) : null,
          };
        });

        let photo = abuser.photo;
        if (photo) {
          photo = getProfileImage(`${process.env.BASE_URL}${photo}`);
        } else {
          photo = null;
        }

        result.push({
          id: abuser.id,
          full_name: abuser.full_name,
          alias_name: abuser.alias_name,
          gender: abuser.gender,
          phone: abuser.phone,
          email: abuser.email,
          photo,
          report_count: reports.length,
          victims: uniqueVictims,
        });
      }

      return callback(null, {
        data: {
          rows: result,
          total: typeof abusers.count === "number" ? abusers.count : abusers.count.length,
          currentPage: parsedPage,
          totalPages: Math.ceil((typeof abusers.count === "number" ? abusers.count : abusers.count.length) / parsedLimit),
        },
        message: "ABUSERS_WITH_REPORT_STATS_FETCHED_SUCCESSFULLY",
      });
    } catch (error) {
      logger.error("ERROR In getAbusersWithReportStats", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_ABUSERS_WITH_REPORT_STATS_FAILED"), null);
    }
  }
}
