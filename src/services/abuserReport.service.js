import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
import fs from "fs/promises";
import path from "path";

const { Abusers, AbuserReports, AbuserReportEvidenceFiles, sequelize } = db;

const parseBoolean = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return value;
};

const fileExists = async (fileUrl) => {
  if (!fileUrl) return false;

  const relativeFilePath = fileUrl.replace(/^\//, "");
  const absoluteFilePath = path.resolve(process.cwd(), relativeFilePath);

  try {
    await fs.access(absoluteFilePath);
    return true;
  } catch (error) {
    return false;
  }
};

export default class AbuserReportService {
  static async registerNewAbuser({ userId, payload }, callback) {
    try {
      const abuser = await Abusers.create({
        user_id: userId,
        full_name: payload.full_name,
        alias_name: payload.alias_name || null,
        gender: payload.gender || null,
        dob: payload.dob || null,
        phone: payload.phone || null,
        email: payload.email || null,
        address: payload.address || null,
        photo: payload.photo || null,
      });

      return callback(null, { data: abuser });
    } catch (error) {
      logger.error("ERROR In registerNewAbuser", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("REGISTER_ABUSER_FAILED"), null);
    }
  }

  static async registerNewAbuserReport({ userId, payload }, callback) {
    const transaction = await sequelize.transaction();

    try {
      const report = await AbuserReports.create(
        {
          user_id: userId,
          abuser_id: payload.abuser_id,
          abuse_type: payload.abuse_type || null,
          incident_date: payload.incident_date || null,
          incident_location: payload.incident_location || null,
          description: payload.description || null,
          witness_information: payload.witness_information || null,
          threat_level: payload.threat_level || null,
          history_of_violence: parseBoolean(payload.history_of_violence),
          weapon_access: parseBoolean(payload.weapon_access),
          restraining_order: parseBoolean(payload.restraining_order),
          notes: payload.notes || null,
        },
        { transaction }
      );

      const evidenceFiles = Array.isArray(payload.evidence_files)
        ? payload.evidence_files
        : [];

      if (evidenceFiles.length > 0) {
        await AbuserReportEvidenceFiles.bulkCreate(
          evidenceFiles.map((file) => ({
            report_id: report.id,
            file_type: file.file_type,
            file_url: file.file_url,
          })),
          { transaction }
        );
      }

      await transaction.commit();

      const createdReport = await AbuserReports.findByPk(report.id, {
        include: [
          {
            model: AbuserReportEvidenceFiles,
            as: "evidence_files",
          },
        ],
      });

      return callback(null, { data: createdReport });
    } catch (error) {
      await transaction.rollback();
      logger.error("ERROR In registerNewAbuserReport", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("REGISTER_ABUSER_REPORT_FAILED"), null);
    }
  }

  static async getMyReports({ userId, payload }, callback) {
    try {
      const limit = payload.limit ? parseInt(payload.limit, 10) : 10;
      const page = payload.page ? parseInt(payload.page, 10) : 1;
      const offset = (page - 1) * limit;

      const reports = await AbuserReports.findAll({
        where: { user_id: userId },
        limit,
        offset,
        order: [["created_at", "DESC"]],
        include: [
          {
            model: AbuserReportEvidenceFiles,
            as: "evidence_files",
          },
          {
            model: Abusers,
            as: "abuser",
          }
        ],
      });

      //update abuser profile image url with base url and evidance file url
      for (const report of reports) {
        if (report.evidence_files && report.evidence_files.length > 0) {
          for (const file of report.evidence_files) {
            if (file?.file_url && (await fileExists(file.file_url))) {
              file.file_url = `${process.env.BASE_URL}${file.file_url}`;
            }else{
              file.file_url = null;
            }
          }
        }
        if (report?.abuser?.photo && (await fileExists(report.abuser.photo))) {
          report.abuser.photo = `${process.env.BASE_URL}${report.abuser.photo}`;
        }else{
          report.abuser.photo = null;
        }
      }

      return callback(null, { data: reports });
    } catch (error) {
      console.log("ERROR In getMyReports", error?.message || error);
      logger.error("ERROR In getMyReports", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_ABUSER_REPORTS_FAILED"), null);
    }
  }
  static async getExistingAbuser({ userId, payload }, callback) {
    try {
      const abuser = await Abusers.findAll({
        where: {
          user_id: userId,
        },
      });
      //process abuser profile image url with base url
      for (const singleAbuser of abuser) {
        if (singleAbuser?.photo && (await fileExists(singleAbuser.photo))) {
          singleAbuser.photo = `${process.env.BASE_URL}${singleAbuser.photo}`;
        }else{
          singleAbuser.photo = null;
        }
      }
      return callback(null, { data: abuser });
  }catch (error) {
      logger.error("ERROR In getExistingAbuser", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_EXISTING_ABUSER_FAILED"), null);
    }

      
  }

  static async deleteReport({ userId, payload }, callback) {
    const transaction = await sequelize.transaction();

    try {
      const reportId = parseInt(payload.reportId, 10);

      if (!reportId) {
        await transaction.rollback();
        return callback(new Error("REPORT_ID_IS_REQUIRED"), null);
      }

      const report = await AbuserReports.findOne({
        where: {
          id: reportId,
          user_id: userId,
        },
        include: [
          {
            model: AbuserReportEvidenceFiles,
            as: "evidence_files",
          },
        ],
        transaction,
      });

      if (!report) {
        await transaction.rollback();
        return callback(new Error("REPORT_NOT_FOUND"), null);
      }

      const evidenceFiles = report.evidence_files || [];
      for (const file of evidenceFiles) {
        if (!file?.file_url) continue;

        const relativeFilePath = file.file_url.replace(/^\//, "");
        const absoluteFilePath = path.resolve(process.cwd(), relativeFilePath);

        try {
          await fs.unlink(absoluteFilePath);
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      }

      await AbuserReportEvidenceFiles.destroy({
        where: { report_id: report.id },
        transaction,
      });

      await report.destroy({ transaction });

      await transaction.commit();
      return callback(null, { data: { reportId: report.id } });
    } catch (error) {
      await transaction.rollback();
      logger.error("ERROR In deleteReport", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("DELETE_REPORT_FAILED"), null);
    }
  }

  static async deleteAbuser({ userId, payload }, callback) {
    const transaction = await sequelize.transaction();

    try {
      const abuserId = parseInt(payload.abuserId, 10);

      if (!abuserId) {
        await transaction.rollback();
        return callback(new Error("ABUSER_ID_IS_REQUIRED"), null);
      }

      const abuser = await Abusers.findOne({
        where: {
          id: abuserId,
          user_id: userId,
        },
        transaction,
      });

      if (!abuser) {
        await transaction.rollback();
        return callback(new Error("ABUSER_NOT_FOUND"), null);
      }

      const reports = await AbuserReports.findAll({
        where: { abuser_id: abuser.id },
        include: [
          {
            model: AbuserReportEvidenceFiles,
            as: "evidence_files",
          },
        ],
        transaction,
      });

      for (const report of reports) {
        const evidenceFiles = report.evidence_files || [];
        for (const file of evidenceFiles) {
          if (!file?.file_url) continue;

          const relativeFilePath = file.file_url.replace(/^\//, "");
          const absoluteFilePath = path.resolve(process.cwd(), relativeFilePath);

          try {
            await fs.unlink(absoluteFilePath);
          } catch (error) {
            if (error.code !== "ENOENT") {
              throw error;
            }
          }
        }
      }

      const reportIds = reports.map((report) => report.id);
      if (reportIds.length > 0) {
        await AbuserReportEvidenceFiles.destroy({
          where: { report_id: reportIds },
          transaction,
        });

        await AbuserReports.destroy({
          where: { id: reportIds },
          transaction,
        });
      }

      if (abuser.photo) {
        const relativePhotoPath = abuser.photo.replace(/^\//, "");
        const absolutePhotoPath = path.resolve(process.cwd(), relativePhotoPath);

        try {
          await fs.unlink(absolutePhotoPath);
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      }

      await abuser.destroy({ transaction });
      await transaction.commit();

      return callback(null, { data: { abuserId: abuser.id, deletedReports: reportIds.length } });
    } catch (error) {
      await transaction.rollback();
      logger.error("ERROR In deleteAbuser", { error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("DELETE_ABUSER_FAILED"), null);
    }
  }
}
