import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import Joi from "joi";
import AdminService from "../services/admin.service.js";
export default class AdminController {
  static async registerAdminUser(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
          "string.base": headers?.i18n.__("ADMIN_NAME_STRING"),
          "string.empty": headers?.i18n.__("ADMIN_NAME_REQUIRED"),
          "string.min": headers?.i18n.__("ADMIN_NAME_MIN"),
          "string.max": headers?.i18n.__("ADMIN_NAME_MAX"),
          "any.required": headers?.i18n.__("ADMIN_NAME_REQUIRED"),
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          "string.base": headers?.i18n.__("ADMIN_EMAIL_STRING"),
          "string.email": headers?.i18n.__("ADMIN_EMAIL_VALID"),
          "string.empty": headers?.i18n.__("ADMIN_EMAIL_REQUIRED"),
          "any.required": headers?.i18n.__("ADMIN_EMAIL_REQUIRED"),
        }),
      phone: Joi.string()
        .pattern(/^\+?\d{10,15}$/)
        .required()
        .messages({
          "string.pattern.base": headers?.i18n.__("ADMIN_PHONE_VALID"),
          "string.empty": headers?.i18n.__("ADMIN_PHONE_REQUIRED"),
          "any.required": headers?.i18n.__("ADMIN_PHONE_REQUIRED"),
        }),
      password: Joi.string()
        .min(6)
        .required()
        .messages({
          "string.min": headers?.i18n.__("ADMIN_PASSWORD_MIN"),
          "string.empty": headers?.i18n.__("ADMIN_PASSWORD_REQUIRED"),
          "any.required": headers?.i18n.__("ADMIN_PASSWORD_REQUIRED"),
        }),
    });
    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        message: headers?.i18n.__(error.details[0].message || "INVALID_INPUT"),
        error: { reason: error.details[0].message },
      };
    }
    return new Promise((resolve) => {
      AdminService.registerAdmin(
        { payload: value, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "REGISTER_ADMIN_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("REGISTER_ADMIN_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async loginAdminUser(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      // Joi validation for email and password
      const schema = Joi.object({
        email: Joi.string()
          .email()
          .required()
          .messages({
            "string.base": headers?.i18n.__("ADMIN_EMAIL_STRING"),
            "string.email": headers?.i18n.__("ADMIN_EMAIL_VALID"),
            "string.empty": headers?.i18n.__("ADMIN_EMAIL_REQUIRED"),
            "any.required": headers?.i18n.__("ADMIN_EMAIL_REQUIRED"),
          }),
        password: Joi.string()
          .min(6)
          .required()
          .messages({
            "string.min": headers?.i18n.__("ADMIN_PASSWORD_MIN"),
            "string.empty": headers?.i18n.__("ADMIN_PASSWORD_REQUIRED"),
            "any.required": headers?.i18n.__("ADMIN_PASSWORD_REQUIRED"),
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
      AdminService.loginAdminUser(
        { payload: value, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(err.message || "ADMIN_LOGIN_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("ADMIN_LOGIN_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async listNgo(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.listNgo({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "LIST_NGO_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("LIST_NGO_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  static async getNgoDetails(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.getNgoDetails({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(
                err.message || "GET_NGO_DETAILS_FAILED",
              ),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("GET_NGO_DETAILS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  static async verifyNgo(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.verifyNgo({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "VERIFY_NGO_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("VERIFY_NGO_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  static async rejectNgo(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.rejectNgo({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "REJECT_NGO_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("REJECT_NGO_SUCCESSFUL"),
          error: null,
        });
      });
    });

  }
  static async changeNgoStatus(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.changeNgoStatus({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "CHANGE_NGO_STATUS_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("CHANGE_NGO_STATUS_SUCCESSFUL"),
          error: null,
        });
      });
    });

  }
}
