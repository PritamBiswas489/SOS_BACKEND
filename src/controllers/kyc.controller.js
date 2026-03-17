import db from "../databases/models/index.js";
import "../config/environment.js";
import axios from "axios";
import KycService from "../services/kyc.service.js";
import * as Sentry from "@sentry/node";
import UserService from "../services/user.service.js";

export default class KycController {
  static async createApplicant(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const userId = user?.id;
    const reApply = payload?.re_apply || 0;

    return new Promise((resolve) => {
      KycService.createApplicant({ userId, reApply }, (err, applicant) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: i18n.__(err.message),
              reason: i18n.__("APPLICANT_CREATION_ERROR"),
            },
          });
        }

        if (applicant?.id) {
          return resolve({
            status: 200,
            data: applicant,
            message: i18n.__("APPLICANT_CREATION_SUCCESS"),
            error: {},
          });
        }

        return resolve({
          status: 500,
          data: null,
          error: {
            message: i18n.__("APPLICANT_CREATION_ERROR"),
            reason: "Unexpected failure",
          },
        });
      });
    });
  }
  static async getAccessToken(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const userId = user?.id;

    return new Promise((resolve) => {
      KycService.getSumSubAccessToken(userId, (err, token) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: i18n.__(err.message),
              reason: i18n.__("SUMSUB_ACCESS_TOKEN_ERROR"),
            },
          });
        }

        return resolve({
          status: 200,
          data: { accessToken: token },
          message: i18n.__("SUMSUB_ACCESS_TOKEN_SUCCESS"),
          error: {},
        });
      });
    });
  }
  static async getUserKycData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const userId = user?.id;
      const kycData = await UserService.getUserKycData(userId);
      if (kycData?.error) {
        return {
          status: 400,
          data: null,
          error: {
            message: i18n.__("USER_KYC_DATA_ERROR"),
            reason: kycData.error,
          },
        };
      }
      if(!kycData?.id){
        return {
          status: 404,
          data: null,
          error: {
            message: i18n.__("USER_KYC_DATA_NOT_FOUND"),
            reason: i18n.__("USER_KYC_DATA_NOT_FOUND"),
          },
        };
      }
      let logData = [];
      if (kycData && typeof kycData === "object" && kycData.applicantId) {
        logData = await KycService.getWebhookDataByApplicantId(
          kycData.applicantId
        );
      }

      return {
        status: 200,
        data: { ...kycData?.dataValues, logData},
        message: i18n.__("USER_KYC_DATA_SUCCESS"),
        error: {},
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: null,
        error: {
          message: i18n.__("USER_KYC_DATA_ERROR"),
          reason: error.message,
        },
      };
    }
  }
  static async createWebhookStatusResponse(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const webhookResponse = await KycService.handleWebhookEvent(payload);
      if (webhookResponse.error) {
        return {
          status: 400,
          data: null,
          error: {
            message: i18n.__("WEBHOOK_HANDLING_ERROR"),
            reason: webhookResponse.error,
          },
        };
      }

      return {
        status: 200,
        data: webhookResponse,
        message: i18n.__("WEBHOOK_HANDLING_SUCCESS"),
        error: {},
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: null,
        error: {
          message: i18n.__("WEBHOOK_HANDLING_ERROR"),
          reason: error.message,
        },
      };
    }
  }

  static async getDocumentImagesByInspectionId(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    const inspectionId = payload?.inspectionId;
    return new Promise((resolve) => {
      KycService.getDocumentImagesByInspectionId(inspectionId, (err, images) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: i18n.__(err.message),
              reason: i18n.__("DOCUMENT_IMAGES_RETRIEVAL_ERROR"),
            },
          });
        }
        return resolve({
          status: 200,
          data: images,
          message: i18n.__("DOCUMENT_IMAGES_RETRIEVAL_SUCCESS"),
          error: {},
        });
      });
    });
  }
}
