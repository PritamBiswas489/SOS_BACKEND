import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import Joi from "joi";
import path from "path";
import logger from "../config/winston.js";
const {UserKycDocuments, User} = db;
 
const kycDocumentSchema = Joi.object({
    fullName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "Full Name must be a string.",
            "string.empty": "Full Name is required.",
            "string.min": "Full Name must be at least 2 characters.",
            "string.max": "Full Name must be at most 100 characters.",
            "any.required": "Full Name is required."
        }),
    residentialAddress: Joi.string()
        .min(5)
        .max(255)
        .required()
        .messages({
            "string.base": "Residential Address must be a string.",
            "string.empty": "Residential Address is required.",
            "string.min": "Residential Address must be at least 5 characters.",
            "string.max": "Residential Address must be at most 255 characters.",
            "any.required": "Residential Address is required."
        }),
    documentType: Joi.string()
        .required()
        .messages({
            "any.only": "Document Type must be one of Utility Bill, National ID, Driver's License, Int'l Passport.",
            "any.required": "Document Type is required."
        }),
});

 

export default class KycService {
    // This method is responsible for handling the submission of KYC documents by users. It takes in the user ID, payload containing user details, uploaded files, and headers for localization. The method processes the input data, prepares it for database insertion, and currently logs the data to the console for verification. The actual database insertion logic is yet to be implemented.
    static async submitKycDocuments({ userId, payload, file, headers, transaction = null }, callback) {
        console.log("Submitting KYC documents for user:", userId);
        console.log("Payload:", payload);
        console.log("File:", file);
        // Validate payload
        const { error: payloadError } = kycDocumentSchema.validate(payload);
         
        if (payloadError) {
            // Custom handling for 'is not allowed' error
            const notAllowedDetail = payloadError.details.find(d => d.type === 'object.unknown');
            if (notAllowedDetail) {
                return callback(new Error(`Field '${notAllowedDetail.path[0]}' is not allowed.`), null);
            }
            return callback(new Error(payloadError.details[0].message), null);
        }
         
        if (!file?.path) {
            return callback(new Error("Document file is required."), null); 
        }
        const checkExisting = await UserKycDocuments.findOne({ where: { user_id: userId } });
        if (checkExisting) {
            const updateData = {
                name: payload.fullName,
                address: payload.residentialAddress,
                document_type: payload.documentType,
                document_originalname: file.originalname,
                document_path: file.path,
                status: "pending",
            };
            try {
                await UserKycDocuments.update(updateData, { where: { user_id: userId }, transaction });
                const updatedKycDocument = await UserKycDocuments.findOne({ where: { user_id: userId }, transaction });
                //await this.changeStatus({ userId, payload: { status: "approved" }, headers }, () => {});
                return callback(null, { data: updatedKycDocument });
            } catch (error) {
                console.error("Error updating KYC document:", error);
                logger.error("ERROR In submitKycDocuments - update", { error: error });
                process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
                return callback(new Error('UPDATE_ERROR'), null);
            }
        }
        const insertData = {
            user_id: userId,
            name: payload.fullName,
            address: payload.residentialAddress,
            document_type: payload.documentType,
            document_originalname: file ? file.originalname : null,
            document_path: file ? file.path : null,
            status: "pending",    
        };
        console.log("Data to be inserted into UserKyc:", insertData);
        try {
            const newKycDocument = await UserKycDocuments.create(insertData, { transaction });
            //await this.changeStatus({ userId, payload: { status: "approved" }, headers }, () => {});
            return callback(null, { data: newKycDocument });
        } catch (error) {
            console.error("Error inserting KYC document:", error);
            logger.error("ERROR In submitKycDocuments - insert", { error: error });
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
            return callback(new Error('INSERT_ERROR'), null);
        }
    }
    // This method is responsible for retrieving the KYC documents of a user. It takes in the user ID, payload, and headers for localization. The method queries the database for the user's KYC document and returns it in the callback. If no document is found, it returns null. If any errors occur during this process, they are logged and captured by Sentry, and an appropriate error message is returned in the callback.
    static async getKycDocuments({ userId, payload, headers }, callback) {
        try {
            const kycDocument = await UserKycDocuments.findOne({ where: { user_id: userId } });
            if (!kycDocument) {
                return callback(null, { data: null });
            }
            const documentFilename = path.basename(kycDocument.document_path);
            return callback(null, { data: { ...kycDocument.toJSON(), documentUrl: process.env.BASE_URL + '/uploads/kyc/' + documentFilename } });
        } catch (error) {
            console.error("Error fetching KYC document:", error);
            logger.error("ERROR In getKycDocuments", { error: error });
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
            return callback(new Error('FETCH_ERROR'), null);
        }
    }
    // This method is responsible for changing the status of a user's KYC document. It takes in the user ID, payload containing the new status, and headers for localization. The method first checks if a KYC document exists for the user, and if it does, it updates the status in the database. The updated KYC document is then returned in the callback. If any errors occur during this process, they are logged and captured by Sentry, and an appropriate error message is returned in the callback.
    static async changeStatus({ userId, payload, headers }, callback) {
        console.log("Changing KYC document status for user:", userId);
        try {
            const kycDocument = await UserKycDocuments.findOne({ where: { user_id: userId } });
            if (!kycDocument) {
                return callback(new Error('KYC_DOCUMENT_NOT_FOUND'), null);
            }
            await UserKycDocuments.update({ status: payload.status }, { where: { user_id: userId } });
            const updatedKycDocument = await UserKycDocuments.findOne({ where: { user_id: userId } });
            if(payload.status === "approved"){
                 await User.update({ is_verified: true}, { where: { id: userId } }); 

            }else{
                await User.update({ is_verified: false}, { where: { id: userId } });
            }
            return callback(null, { data: updatedKycDocument });
        }catch (error) {
            console.error("Error changing KYC document status:", error);
            logger.error("ERROR In changeStatus", { error: error });
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
            return callback(new Error('STATUS_CHANGE_ERROR'), null);
        }
    }
}