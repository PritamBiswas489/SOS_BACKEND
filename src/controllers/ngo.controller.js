import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import Joi from "joi";
import NgoService from "../services/ngo.service.js";

export default class NgoController {
  //* Ngo Registration
  static async registerNgo(request) {
    const { payload, headers } = request;
    console.log("payload in controller", payload);
    const schema = Joi.object({
      name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
          "string.base": headers?.i18n.__("NGO_NAME_STRING"),
          "string.empty": headers?.i18n.__("NGO_NAME_REQUIRED"),
          "string.min": headers?.i18n.__("NGO_NAME_MIN"),
          "string.max": headers?.i18n.__("NGO_NAME_MAX"),
          "any.required": headers?.i18n.__("NGO_NAME_REQUIRED"),
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          "string.base": headers?.i18n.__("NGO_EMAIL_STRING"),
          "string.email": headers?.i18n.__("NGO_EMAIL_VALID"),
          "string.empty": headers?.i18n.__("NGO_EMAIL_REQUIRED"),
          "any.required": headers?.i18n.__("NGO_EMAIL_REQUIRED"),
        }),
      phoneNumber: Joi.string()
        .pattern(/^\+?\d{10,15}$/)
        .required()
        .messages({
          "string.pattern.base": headers?.i18n.__("NGO_PHONE_VALID"),
          "string.empty": headers?.i18n.__("NGO_PHONE_REQUIRED"),
          "any.required": headers?.i18n.__("NGO_PHONE_REQUIRED"),
        }),
      password: Joi.string()
        .min(6)
        .required()
        .messages({
          "string.min": headers?.i18n.__("NGO_PASSWORD_MIN"),
          "string.empty": headers?.i18n.__("NGO_PASSWORD_REQUIRED"),
          "any.required": headers?.i18n.__("NGO_PASSWORD_REQUIRED"),
        }),
      numberOfUser: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          "number.base": headers?.i18n.__("NGO_NUMBER_OF_USER_NUMBER"),
          "number.min": headers?.i18n.__("NGO_NUMBER_OF_USER_MIN"),
          "any.required": headers?.i18n.__("NGO_NUMBER_OF_USER_REQUIRED"),
        }),
      certificateFile: Joi.string()
        .required()
        .messages({
          "string.base": headers?.i18n.__("NGO_CERTIFICATE_STRING"),
          "string.empty": headers?.i18n.__("NGO_CERTIFICATE_REQUIRED"),
          "any.required": headers?.i18n.__("NGO_CERTIFICATE_REQUIRED"),
        }),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(
            error.details[0].message || "VALIDATION_ERROR",
          ),
          reason: error.details[0].message,
        },
      };
    }
    return new Promise((resolve) => {
      NgoService.registerNgo({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "REGISTER_NGO_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("REGISTER_NGO_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  //* Ngo Login
  static async ngoLogin(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      // Joi validation for email and password
      const schema = Joi.object({
        email: Joi.string()
          .email()
          .required()
          .messages({
            "string.base": headers?.i18n.__("NGO_EMAIL_STRING"),
            "string.email": headers?.i18n.__("NGO_EMAIL_VALID"),
            "string.empty": headers?.i18n.__("NGO_EMAIL_REQUIRED"),
            "any.required": headers?.i18n.__("NGO_EMAIL_REQUIRED"),
          }),
        password: Joi.string()
          .min(6)
          .required()
          .messages({
            "string.min": headers?.i18n.__("NGO_PASSWORD_MIN"),
            "string.empty": headers?.i18n.__("NGO_PASSWORD_REQUIRED"),
            "any.required": headers?.i18n.__("NGO_PASSWORD_REQUIRED"),
          }),
      });
      const { error, value } = schema.validate(payload);
      if (error) {
        return resolve({
          status: 400,
          data: null,
          error: {
            message: headers?.i18n.__(
              error.details[0].message || "VALIDATION_ERROR",
            ),
            reason: error.details[0].message,
          },
        });
      }
      NgoService.ngoLogin({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "NGO_LOGIN_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("NGO_LOGIN_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async getNgoDetails(request) {}
  static async approvalOfNgo(request) {}
  static async registerUserForNgo(request) {
    const { file, payload, headers, user } = request;
    const ngo_id = user?.id;

    const schema = Joi.object({
      fullName: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
          "string.base": headers.i18n.__("FULL_NAME_MUST_BE_A_STRING"),
          "string.empty": headers.i18n.__("FULL_NAME_IS_REQUIRED"),
          "string.min": headers.i18n.__("FULL_NAME_MIN_LENGTH", { min: 3 }),
          "string.max": headers.i18n.__("FULL_NAME_MAX_LENGTH", { max: 100 }),
          "any.required": headers.i18n.__("FULL_NAME_IS_REQUIRED"),
        }),
      phoneNumber: Joi.string()
        .pattern(/^\+\d{10,15}$/)
        .required()
        .messages({
          "string.pattern.base": headers.i18n.__("PHONE_NUMBER_INVALID_FORMAT"),
          "string.empty": headers.i18n.__("PHONE_NUMBER_IS_REQUIRED"),
          "any.required": headers.i18n.__("PHONE_NUMBER_IS_REQUIRED"),
        }),
      emailAddress: Joi.string()
        .email()
        .optional()
        .allow("", null)
        .messages({
          "string.email": headers.i18n.__("EMAIL_ADDRESS_INVALID"),
        }),
      residentialAddress: Joi.string()
        .min(5)
        .max(255)
        .required()
        .messages({
          "string.base": headers.i18n.__(
            "RESIDENTIAL_ADDRESS_MUST_BE_A_STRING",
          ),
          "string.empty": headers.i18n.__("RESIDENTIAL_ADDRESS_IS_REQUIRED"),
          "string.min": headers.i18n.__("RESIDENTIAL_ADDRESS_MIN_LENGTH", {
            min: 5,
          }),
          "string.max": headers.i18n.__("RESIDENTIAL_ADDRESS_MAX_LENGTH", {
            max: 255,
          }),
          "any.required": headers.i18n.__("RESIDENTIAL_ADDRESS_IS_REQUIRED"),
        }),
      documentType: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
          "string.base": headers.i18n.__("DOCUMENT_TYPE_MUST_BE_A_STRING"),
          "string.empty": headers.i18n.__("DOCUMENT_TYPE_IS_REQUIRED"),
          "string.min": headers.i18n.__("DOCUMENT_TYPE_MIN_LENGTH", { min: 3 }),
          "string.max": headers.i18n.__("DOCUMENT_TYPE_MAX_LENGTH", {
            max: 50,
          }),
          "any.required": headers.i18n.__("DOCUMENT_TYPE_IS_REQUIRED"),
        }),
    });

    // Validate payload
    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message:
            error.details[0].message || headers.i18n.__("VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      NgoService.registerUserForNgo(
        { file, payload: { ...value, ngo_id }, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "REGISTER_USER_FOR_NGO_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("REGISTER_USER_FOR_NGO_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
}
