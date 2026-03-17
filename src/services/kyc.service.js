import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import axios from "axios";
import crypto from "crypto";
import UserService from "./user.service.js";
import { v4 as uuidv4 } from "uuid";
import CambodiaPaymentService from "./cambodiaPayment.service.js";

const { Op, User, KycStatusWebhook, kycVerifiedDocuments, UserKyc } = db;

export default class KycService {
  static async createApplicant(args, callback) {
    try {
      const APP_TOKEN = process.env.SUMSUB_API_KEY; // Your token
      const SECRET_KEY = process.env.SUMSUB_API_SECRET; // ⚠️ Replace with your secret from Sumsub dashboard
      const URL_PATH = "/resources/applicants?levelName=id-and-liveness"; // Exact path, no domain
      const FULL_URL = process.env.SUMSUB_API_URL + URL_PATH;

      const reApply = parseInt(args.reApply) || 0;

      if (reApply === 1) {
        // If reApply is 1, delete existing KYC data for the user
        await UserService.deleteUserKycData(args.userId);
      }

      const user = await UserService.getUserById(args.userId);

      if (!user) return callback(new Error("USER_NOT_FOUND"));

      let firstName = "user " + user?.id;
      let lastName = user?.phoneNumber || "";

      if (user && user.name) {
        const nameParts = user.name.split(" ");
        if (nameParts[0]) firstName = nameParts[0];
        if (nameParts[1]) lastName = nameParts[1];
      }

      const existingKycData = await UserService.getUserKycData(args.userId);
      if (
        existingKycData &&
        typeof existingKycData.applicantId === "string" &&
        existingKycData.applicantId.trim() !== ""
      ) {
        return callback(null, existingKycData);
      }
      // If KYC data exists, delete it before creating a new applicant
      if (existingKycData) {
        await UserService.deleteUserKycData(args.userId);
      }

      const newSiteApplicantId = uuidv4();

      const createSiteApplicant = await UserService.createSiteApplicant({
        id: newSiteApplicantId,
        userId: args.userId,
      });
      if (!createSiteApplicant?.id) {
        return callback(new Error("FAILED_TO_CREATE_SITE_APPLICANT"));
      }

      const body = {
        externalUserId: createSiteApplicant.uuid,
        fixedInfo: {
          firstName: firstName,
          lastName: lastName,
          nationality: "ISR",
          country: "ISR",
          countryOfBirth: "ISR",
          addresses: [
            {
              country: "ISR",
            },
          ],
          taxResidenceCountry: "ISR",
          residenceCountry: "ISR",
        },
        type: "individual",
      };

      const bodyJson = JSON.stringify(body);
      const ts = Math.floor(Date.now() / 1000);

      const stringToSign = `${ts}POST${URL_PATH}${bodyJson}`;

      const signature = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(stringToSign)
        .digest("hex");

      const headers = {
        "Content-Type": "application/json",
        "X-App-Token": APP_TOKEN,
        "X-App-Access-Sig": signature,
        "X-App-Access-Ts": ts,
      };
      try {
        const response = await axios.post(FULL_URL, bodyJson, { headers });
        if (response.data?.id) {
          await UserService.updateKycData({
            applicantid: response.data?.id,
            id: createSiteApplicant.id,
          });
          const updatedKyc = await UserService.getUserKycData(args.userId);
          return callback(null, updatedKyc);
        }
        // If the response does not contain an ID, delete the KYC data
        await UserService.deleteUserKycData(args.userId);
        return callback(new Error("NO_APPLICANT_ID_IN_RESPONSE"));
      } catch (err) {
        if (err.response && err.response.status === 409) {
          // Applicant already exists, return a specific message or handle accordingly
          return callback(new Error("APPLICANT_ALREADY_EXISTS"));
        } else {
          return callback(err);
        }
      }
    } catch (error) {
      console.error("Error occurred while creating applicant:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(error);
    }
  }
  static async getSumSubAccessToken(userId, callback) {
    try {
      const APP_TOKEN = process.env.SUMSUB_API_KEY; // Your token
      const SECRET_KEY = process.env.SUMSUB_API_SECRET; // ⚠️ Replace with your secret from Sumsub dashboard
      const userkyc = await UserService.getUserKycData(userId);
      if (!userkyc || !userkyc.applicantId) {
        return callback(new Error("APPLICANT_ID_NOT_FOUND"));
      }
      // console.log(userkyc.uuid);

      const URL_PATH = "/resources/accessTokens/sdk"; // Exact path, no domain
      const FULL_URL = process.env.SUMSUB_API_URL + URL_PATH;
      const body = {
        userId: userkyc.uuid,
        levelName: "id-and-liveness",
        ttlInSecs: 600,
      };
      const bodyJson = JSON.stringify(body);
      const ts = Math.floor(Date.now() / 1000);

      const stringToSign = `${ts}POST${URL_PATH}${bodyJson}`;

      const signature = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(stringToSign)
        .digest("hex");

      const headers = {
        "Content-Type": "application/json",
        "X-App-Token": APP_TOKEN,
        "X-App-Access-Sig": signature,
        "X-App-Access-Ts": ts,
      };
      const response = await axios.post(FULL_URL, bodyJson, { headers });
      if (response.data?.token) {
        return callback(null, response.data.token);
      } else {
        return callback(new Error("FAILED_TO_GET_ACCESS_TOKEN"));
      }
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(error);
    }
  }
  static async handleWebhookEvent(webhookData) {
    try {
      // Process the webhook data as needed
      // console.log("Received Sumsub KYC webhook:", webhookData);
      // You can add your logic here to handle the webhook event
      if (webhookData?.applicantId) {
        const createWebResponse = await KycStatusWebhook.create(
          {
            applicantId: webhookData?.applicantId,
            inspectionId: webhookData?.inspectionId,
            applicantType: webhookData?.applicantType,
            correlationId: webhookData?.correlationId,
            levelName: webhookData?.levelName,
            externalUserId: webhookData?.externalUserId,
            type: webhookData?.type,
            sandboxMode: webhookData?.sandboxMode,
            reviewStatus: webhookData?.reviewStatus,
            createdAtMs: webhookData?.createdAtMs,
            createdAt: webhookData?.createdAt,
            clientId: webhookData?.clientId,
            applicantActionId: webhookData?.applicantActionId,
            reviewAnswer: webhookData?.reviewResult?.reviewAnswer,
            reviewRejectType: webhookData?.reviewResult?.reviewRejectType,
            rejectLabels: webhookData?.reviewResult?.rejectLabels,
            buttonIds: webhookData?.buttonIds,
            rawPayload: webhookData,
          }

          //======= Update kyc status in UserKyc table =======//
        );

        let currentStatus = "";

        if (
          webhookData?.type === "applicantCreated" &&
          webhookData?.reviewStatus === "init"
        ) {
          currentStatus = "created";
        }
        if (
          webhookData?.type === "applicantPending" &&
          webhookData?.reviewStatus === "pending"
        ) {
          currentStatus = "Pending";
        }
        if (
          (webhookData?.type === "applicantOnHold" ||
            webhookData?.type === "applicantActionOnHold") &&
          (webhookData?.reviewStatus === "onHold" ||
            webhookData?.reviewStatus === "init")
        ) {
          currentStatus = "On Hold";
        }

        // Approved
        if (
          (webhookData?.type === "applicantReviewed" ||
            webhookData?.type === "applicantReset" ||
            webhookData?.type === "applicantActionReviewed" ||
            webhookData?.type === "applicantWorkflowCompleted") &&
          webhookData?.reviewStatus === "completed" &&
          webhookData?.reviewResult?.reviewAnswer === "GREEN"
        ) {
          currentStatus = "Approved";
        }

        // Rejected
        if (
          (webhookData?.type === "applicantWorkflowCompleted" ||
            webhookData?.type === "applicantWorkflowFailed") &&
          webhookData?.reviewStatus === "completed" &&
          webhookData?.reviewResult?.reviewAnswer === "RED"
        ) {
          currentStatus = "Rejected";
          // Optionally, check for FINAL reject type to indicate non-retryable
          if (webhookData?.reviewResult?.reviewRejectType === "FINAL") {
            currentStatus = "Failed";
          }
        }

        if (
          webhookData?.type === "applicantReset" &&
          webhookData?.reviewStatus === "init"
        ) {
          currentStatus = "Reset";
        }
        // Deactivated
        if (
          webhookData?.type === "applicantDeactivated" &&
          webhookData?.reviewStatus === "init"
        ) {
          currentStatus = "Deactivated";
        }

        if (
          webhookData?.type === "applicantActivated" &&
          webhookData?.reviewStatus === "init"
        ) {
          currentStatus = "Activated";
        }

        if (
          webhookData?.type === "applicantDeleted" &&
          webhookData?.reviewStatus === "init"
        ) {
          currentStatus = "Deleted";
        }

        // Level Changed
        if (
          webhookData?.type === "applicantLevelChanged" &&
          webhookData?.reviewStatus === "init"
        ) {
          currentStatus = "Level Changed";
        }

        if (
          webhookData?.type === "applicantActionPending" &&
          webhookData?.reviewStatus === "completed"
        ) {
          currentStatus = "Action Pending";
        }

        if (
          webhookData?.type === "applicantPersonalInfoChanged" &&
          webhookData?.reviewStatus === "completed"
        ) {
          currentStatus = "Personal Info Changed";
        }

        if (
          webhookData?.type === "applicantTagsChanged" &&
          webhookData?.reviewStatus === "completed"
        ) {
          currentStatus = "Tags Changed";
        }

        if (currentStatus !== "") {
          const updateKycData = await UserService.updateKycStatus({
            status: currentStatus,
            applicantid: webhookData?.applicantId,
          });

          if (!updateKycData) {
            throw new Error("Failed to update KYC data status");
          }

          if(currentStatus === "Approved"){
                await this.kycSaveUserDocuments({
                  uuid: webhookData?.externalUserId, 
                  applicantId: webhookData?.applicantId, 
                  inspectionId: webhookData?.inspectionId
                });
                // Trigger Cambodia payment KYC update
                const userKycData = await UserKyc.findOne({
                  where: { applicantId : webhookData?.applicantId },
                });
                await CambodiaPaymentService.createUser(
                  {
                    payload: {},
                    userId: updateKycData.userId,
                    i18n: null,
                  },
                  async () => {
                    await CambodiaPaymentService.updateKyc(
                      {
                        payload: {},
                        userId: updateKycData.userId,
                        i18n: null,
                      },
                      () => {}
                    );
                  }
                );
          }
        }

        if (createWebResponse) {
          console.log("Webhook data saved successfully:", createWebResponse);
          return { status: 200, data: createWebResponse };
        } else {
          throw new Error("Failed to save webhook data");
        }
      }
    } catch (error) {
      console.error("Error processing Sumsub KYC webhook:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        error: error && error.message ? error.message : String(error),
      };
    }
  }
  static async getWebhookDataByApplicantId(applicantId) {
    try {
      const webhookData = await KycStatusWebhook.findAll({
        where: { applicantId },
      });
      return webhookData;
    } catch (error) {
      console.error("Error fetching webhook data by applicant ID:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  static async deleteWebHookStatus(applicantId) {
    try {
      const deletedWebhook = await KycStatusWebhook.destroy({
        where: { applicantId },
      });
      return deletedWebhook;
    } catch (error) {
      console.error("Error deleting webhook status:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw error;
    }
  }
  static async kycSaveUserDocuments({uuid, applicantId, inspectionId}) {
    try {
      let userId = null;
      const userKycData = await UserKyc.findOne({
        where: { applicantId , uuid},
      });
      if(userKycData){
        userId = userKycData.userId;
      }
      if (!userId) {
        throw new Error("USER_ID_NOT_FOUND_FOR_APPLICANT");
      }
      const APP_TOKEN = process.env.SUMSUB_API_KEY;
      const SECRET_KEY = process.env.SUMSUB_API_SECRET;
      const API_URL = process.env.SUMSUB_API_URL;
      const URL_PATH = `/resources/applicants/${applicantId}/metadata/resources`;
      const ts = Math.floor(Date.now() / 1000);
      const stringToSign = `${ts}GET${URL_PATH}`;
      const signature = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(stringToSign)
        .digest("hex");

      const headers = {
        "Content-Type": "application/json",
        "X-App-Token": APP_TOKEN,
        "X-App-Access-Sig": signature,
        "X-App-Access-Ts": ts,
      };

      const response = await axios({
        method: "GET",
        url: `${API_URL}${URL_PATH}`,
        headers: headers,
      });
      const checkExistingDocs = await kycVerifiedDocuments.findOne({
        where: { userId, applicantId, inspectionId },
      });
      if (checkExistingDocs) {
        checkExistingDocs.documentData = response.data;
        await checkExistingDocs.save();
        console.log("KYC user documents updated successfully.");
        return;
      } else {
        await kycVerifiedDocuments.create({
          userId,
          applicantId,
          inspectionId,
          documentData: response.data,
        });
        console.log("KYC user documents saved successfully.");
        await this.kycSaveUserDocumentFiles(userId, applicantId, inspectionId);
        return;
      }
    } catch (error) {
      console.error("Error saving KYC user documents:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
    }
  }
  static async kycSaveUserDocumentFiles(userId, applicantId, inspectionId) {
   
    try {
       const checkExistingDocs = await kycVerifiedDocuments.findOne({
        where: { userId, applicantId, inspectionId },
      });
      if(!checkExistingDocs){
        throw new Error("KYC_DOCUMENT_DATA_NOT_FOUND");
      }
      const documentData = checkExistingDocs.documentData;
      const documentDataItems = documentData?.items;
      const imgDtaArray = [];
      for (const item of documentDataItems) {
        const imageId = item?.id;
        const imagetype = item?.idDocDef?.idDocType || "unknown";
        const imageSide = item?.idDocDef?.idDocSubType || "unknown";
        imgDtaArray.push({ imageId, imagetype, imageSide });
      }
      const APP_TOKEN = process.env.SUMSUB_API_KEY;
      const SECRET_KEY = process.env.SUMSUB_API_SECRET;
      const API_URL = process.env.SUMSUB_API_URL;
     
      //saving images one by one
      const saveFileData = []; 
      for (const imgData of imgDtaArray) {
        const { imageId, imagetype, imageSide } = imgData;
        const URL_PATH = `/resources/inspections/${inspectionId}/resources/${imageId}`;
        const ts = Math.floor(Date.now() / 1000);
        const stringToSign = `${ts}GET${URL_PATH}`;

        const signature = crypto
          .createHmac("sha256", SECRET_KEY)
          .update(stringToSign)
          .digest("hex");

        const headers = {
          "X-App-Token": APP_TOKEN,
          "X-App-Access-Sig": signature,
          "X-App-Access-Ts": ts,
        };

        const response = await axios({
          method: "GET",
          url: `${API_URL}${URL_PATH}`,
          headers: headers,
          responseType: "arraybuffer",
        });

        const fs = await import("fs/promises");
        const path = await import("path");
        const uploadDir = path.join(process.cwd(), "uploads", "kyc", userId.toString());

        await fs.mkdir(uploadDir, { recursive: true });

        const getExtensionFromMimeType = (mimeType) => {
          const mimeToExt = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/bmp": "bmp",
            "image/webp": "webp",
            "image/tiff": "tiff",
            "application/pdf": "pdf",
          };
          return mimeToExt[mimeType] || "bin";
        };

        const contentType = response.headers["content-type"];
        const extension = getExtensionFromMimeType(contentType);
        const fileName = `${imageId}.${extension}`;
        const outputPath = path.join(uploadDir, fileName);

        await fs.writeFile(outputPath, Buffer.from(response.data));
        console.log(`✓ Image saved successfully: ${outputPath}`);
        
        if(imagetype === 'SELFIE'){
            saveFileData.push({
                selfiePath: outputPath,
                documentType: "SELFIE",
            });
        }else{
            saveFileData.push({
                documentPath: outputPath,
                documentType: imageSide,
            });
        }
      }
      checkExistingDocs.documentFiles = saveFileData;
      await checkExistingDocs.save();
      console.log("KYC user document files saved successfully.");
      return;
    } catch (error) {
      console.error("Error saving KYC user document files:", error);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
    }
  }
}
