import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import Joi from "joi";
import AdminService from "../services/admin.service.js";
import AndroidApkService from "../services/androidApk.service.js";
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
              message: headers?.i18n.__(
                err.message || "CHANGE_NGO_STATUS_FAILED",
              ),
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
  // AdminController method for uploading Android APK
  static async uploadAndroidApp(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AndroidApkService.uploadAndroidApp(
        { payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(err.message || "UPLOAD_APK_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("UPLOAD_APK_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async getApkReleases(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AndroidApkService.getApkReleases(
        { payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_APK_RELEASES_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("GET_APK_RELEASES_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async upgradeNgoUserLimit(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.upgradeNgoUserLimit(
        { payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "UPGRADE_NGO_USER_LIMIT_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("UPGRADE_NGO_USER_LIMIT_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  // AdminController method for getting NGO autocomplete by name
  static async getNgoAutocompleteByName(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.getNgoAutocompleteByName(
        { payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_NGO_AUTOCOMPLETE_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("GET_NGO_AUTOCOMPLETE_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }

  static async listUsers(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.listUsers({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "LIST_USERS_FAILED"),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("LIST_USERS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  static async changeUserStatus(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.changeUserStatus({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(
                err.message || "CHANGE_USER_STATUS_FAILED",
              ),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("CHANGE_USER_STATUS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  static async getPendingKycDocuments(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.getPendingKycDocuments({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(
                err.message || "GET_PENDING_KYC_DOCUMENTS_FAILED",
              ),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("GET_PENDING_KYC_DOCUMENTS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
  static async changeKycDocumentStatus(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.changeKycDocumentStatus({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(
                err.message || "CHANGE_KYC_DOCUMENT_STATUS_FAILED",
              ),
              reason: err.message,
            },
          });
        }
        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("CHANGE_KYC_DOCUMENT_STATUS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async listSos(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.listSos({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "LIST_SOS_FOR_ADMIN_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("LIST_SOS_FOR_ADMIN_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async listAppFeedback(request) {
    const { payload, headers } = request;
    return new Promise((resolve) => {
      AdminService.listAppFeedback({ payload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "LIST_APP_FEEDBACK_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("LIST_APP_FEEDBACK_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async replyAppFeedback(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      feedback_id: Joi.number().integer().positive().required().messages({
        "number.base": headers?.i18n.__("FEEDBACK_ID_MUST_BE_NUMBER"),
        "number.integer": headers?.i18n.__("FEEDBACK_ID_MUST_BE_INTEGER"),
        "number.positive": headers?.i18n.__("FEEDBACK_ID_MUST_BE_POSITIVE"),
        "any.required": headers?.i18n.__("FEEDBACK_ID_REQUIRED"),
      }),
      message: Joi.string().trim().min(1).required().messages({
        "string.base": headers?.i18n.__("REPLY_MESSAGE_STRING"),
        "string.empty": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
        "string.min": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
        "any.required": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
      }),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.replyAppFeedback({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "REPLY_APP_FEEDBACK_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("REPLY_APP_FEEDBACK_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async updateAppFeedbackStatus(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      feedback_id: Joi.number().integer().positive().required().messages({
        "number.base": headers?.i18n.__("FEEDBACK_ID_MUST_BE_NUMBER"),
        "number.integer": headers?.i18n.__("FEEDBACK_ID_MUST_BE_INTEGER"),
        "number.positive": headers?.i18n.__("FEEDBACK_ID_MUST_BE_POSITIVE"),
        "any.required": headers?.i18n.__("FEEDBACK_ID_REQUIRED"),
      }),
      status: Joi.string().valid("new", "reviewed", "resolved", "ignored").required().messages({
        "string.base": headers?.i18n.__("APP_FEEDBACK_STATUS_STRING"),
        "any.only": headers?.i18n.__("APP_FEEDBACK_STATUS_INVALID"),
        "any.required": headers?.i18n.__("APP_FEEDBACK_STATUS_REQUIRED"),
      }),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.updateAppFeedbackStatus({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "UPDATE_APP_FEEDBACK_STATUS_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("UPDATE_APP_FEEDBACK_STATUS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async listRequestIosAccess(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      user_id: Joi.number().integer().positive().optional(),
      mobileNumber: Joi.string().trim().optional(),
      testFlightEmail: Joi.string().email().optional(),
      status: Joi.string().valid("new", "added", "failed").optional(),
      limit: Joi.number().integer().min(1).max(100).default(10),
      page: Joi.number().integer().min(1).default(1),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.listRequestIosAccess({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "LIST_REQUEST_IOS_ACCESS_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("LIST_REQUEST_IOS_ACCESS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async changeRequestIosAccessStatus(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
      status: Joi.string().valid("new", "added", "failed").required(),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.changeRequestIosAccessStatus({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "CHANGE_REQUEST_IOS_ACCESS_STATUS_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("CHANGE_REQUEST_IOS_ACCESS_STATUS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async updateEmailForIosAccessRequest(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
      testFlightEmail: Joi.string().email().required(),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.updateEmailForIosAccessRequest({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "UPDATE_EMAIL_FOR_IOS_ACCESS_REQUEST_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("UPDATE_EMAIL_FOR_IOS_ACCESS_REQUEST_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async replyRequestIosAccess(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      request_id: Joi.number().integer().positive().required().messages({
        "number.base": headers?.i18n.__("REQUEST_ID_MUST_BE_NUMBER"),
        "number.integer": headers?.i18n.__("REQUEST_ID_MUST_BE_INTEGER"),
        "number.positive": headers?.i18n.__("REQUEST_ID_MUST_BE_POSITIVE"),
        "any.required": headers?.i18n.__("REQUEST_ID_REQUIRED"),
      }),
      message: Joi.string().trim().min(1).required().messages({
        "string.base": headers?.i18n.__("REPLY_MESSAGE_STRING"),
        "string.empty": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
        "string.min": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
        "any.required": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
      }),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.replyRequestIosAccess({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "REPLY_REQUEST_IOS_ACCESS_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("REPLY_REQUEST_IOS_ACCESS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async listContactAdmin(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      userId: Joi.number().integer().positive().optional(),
      user_id: Joi.number().integer().positive().optional(),
      mobileNumber: Joi.string().trim().optional(),
      fromDate: Joi.date().iso().optional(),
      toDate: Joi.date().iso().optional(),
      limit: Joi.number().integer().min(1).max(100).default(10),
      page: Joi.number().integer().min(1).default(1),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    const normalizedPayload = {
      ...value,
      userId: value.userId || value.user_id,
    };

    return new Promise((resolve) => {
      AdminService.listContactAdmin({ payload: normalizedPayload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "LIST_CONTACT_ADMIN_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("LIST_CONTACT_ADMIN_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async replyContactAdmin(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      contact_id: Joi.number().integer().positive().required().messages({
        "number.base": headers?.i18n.__("CONTACT_ID_MUST_BE_NUMBER"),
        "number.integer": headers?.i18n.__("CONTACT_ID_MUST_BE_INTEGER"),
        "number.positive": headers?.i18n.__("CONTACT_ID_MUST_BE_POSITIVE"),
        "any.required": headers?.i18n.__("CONTACT_ID_REQUIRED"),
      }),
      message: Joi.string().trim().min(1).required().messages({
        "string.base": headers?.i18n.__("REPLY_MESSAGE_STRING"),
        "string.empty": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
        "string.min": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
        "any.required": headers?.i18n.__("REPLY_MESSAGE_REQUIRED"),
      }),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.replyContactAdmin({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "REPLY_CONTACT_ADMIN_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("REPLY_CONTACT_ADMIN_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async listEmergencyServicesLocation(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      requestBy: Joi.number().integer().positive().optional(),
      userId: Joi.number().integer().positive().optional(),
      serviceType: Joi.string().trim().optional(),
      status: Joi.string().valid("pending", "approved").optional(),
      phoneNumber: Joi.string().trim().optional(),
      mobileNumber: Joi.string().trim().optional(),
      placeId: Joi.string().trim().optional(),
      locationName: Joi.string().trim().optional(),
      fromDate: Joi.date().iso().optional(),
      toDate: Joi.date().iso().optional(),
      limit: Joi.number().integer().min(1).max(100).default(10),
      page: Joi.number().integer().min(1).default(1),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    const normalizedPayload = {
      ...value,
      requestBy: value.requestBy || value.userId,
      phoneNumber: value.phoneNumber || value.mobileNumber,
    };

    return new Promise((resolve) => {
      AdminService.listEmergencyServicesLocation({ payload: normalizedPayload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "LIST_EMERGENCY_SERVICES_LOCATION_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("LIST_EMERGENCY_SERVICES_LOCATION_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async changeEmergencyServicesLocationStatus(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      id: Joi.number().integer().positive().required().messages({
        "number.base": headers?.i18n.__("EMERGENCY_SERVICE_ID_MUST_BE_NUMBER"),
        "number.integer": headers?.i18n.__("EMERGENCY_SERVICE_ID_MUST_BE_INTEGER"),
        "number.positive": headers?.i18n.__("EMERGENCY_SERVICE_ID_MUST_BE_POSITIVE"),
        "any.required": headers?.i18n.__("EMERGENCY_SERVICE_ID_REQUIRED"),
      }),
      status: Joi.string().valid("pending", "approved").required().messages({
        "string.base": headers?.i18n.__("EMERGENCY_SERVICE_STATUS_MUST_BE_STRING"),
        "any.only": headers?.i18n.__("EMERGENCY_SERVICE_STATUS_INVALID"),
        "any.required": headers?.i18n.__("EMERGENCY_SERVICE_STATUS_REQUIRED"),
      }),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.changeEmergencyServicesLocationStatus({ payload: value, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "CHANGE_EMERGENCY_SERVICES_LOCATION_STATUS_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("CHANGE_EMERGENCY_SERVICES_LOCATION_STATUS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async getAbuseReportList(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      userId: Joi.number().integer().positive().optional(),
      user_id: Joi.number().integer().positive().optional(),
      abuserId: Joi.number().integer().positive().optional(),
      abuser_id: Joi.number().integer().positive().optional(),
      abuseType: Joi.string().trim().optional(),
      threatLevel: Joi.string().valid("Low", "Medium", "High").optional(),
      history_of_violence: Joi.alternatives().try(Joi.boolean(), Joi.string().valid("true", "false", "1", "0")).optional(),
      weapon_access: Joi.alternatives().try(Joi.boolean(), Joi.string().valid("true", "false", "1", "0")).optional(),
      restraining_order: Joi.alternatives().try(Joi.boolean(), Joi.string().valid("true", "false", "1", "0")).optional(),
      userName: Joi.string().trim().optional(),
      mobileNumber: Joi.string().trim().optional(),
      abuserName: Joi.string().trim().optional(),
      abuserPhone: Joi.string().trim().optional(),
      abuserEmail: Joi.string().trim().optional(),
      incidentFromDate: Joi.date().iso().optional(),
      incidentToDate: Joi.date().iso().optional(),
      fromDate: Joi.date().iso().optional(),
      toDate: Joi.date().iso().optional(),
      limit: Joi.number().integer().min(1).max(100).default(10),
      page: Joi.number().integer().min(1).default(1),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    const parseBooleanInput = (booleanValue) => {
      if (booleanValue === undefined) {
        return undefined;
      }

      if (typeof booleanValue === "boolean") {
        return booleanValue;
      }

      return booleanValue === "true" || booleanValue === "1";
    };

    const normalizedPayload = {
      ...value,
      userId: value.userId || value.user_id,
      abuserId: value.abuserId || value.abuser_id,
      history_of_violence: parseBooleanInput(value.history_of_violence),
      weapon_access: parseBooleanInput(value.weapon_access),
      restraining_order: parseBooleanInput(value.restraining_order),
    };

    return new Promise((resolve) => {
      AdminService.getAbuseReportList({ payload: normalizedPayload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "GET_ABUSE_REPORT_LIST_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("GET_ABUSE_REPORT_LIST_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async getAbusersWithReportStats(request) {
    const { payload, headers } = request;
    const schema = Joi.object({
      abuserId: Joi.number().integer().positive().optional(),
      abuser_id: Joi.number().integer().positive().optional(),
      full_name: Joi.string().trim().optional(),
      alias_name: Joi.string().trim().optional(),
      gender: Joi.string().trim().optional(),
      phone: Joi.string().trim().optional(),
      email: Joi.string().trim().optional(),
      abuseType: Joi.string().trim().optional(),
      abuse_type: Joi.string().trim().optional(),
      threatLevel: Joi.string().valid("Low", "Medium", "High").optional(),
      threat_level: Joi.string().valid("Low", "Medium", "High").optional(),
      history_of_violence: Joi.alternatives().try(Joi.boolean(), Joi.string().valid("true", "false", "1", "0")).optional(),
      weapon_access: Joi.alternatives().try(Joi.boolean(), Joi.string().valid("true", "false", "1", "0")).optional(),
      restraining_order: Joi.alternatives().try(Joi.boolean(), Joi.string().valid("true", "false", "1", "0")).optional(),
      incidentFromDate: Joi.date().iso().optional(),
      incidentToDate: Joi.date().iso().optional(),
      fromDate: Joi.date().iso().optional(),
      toDate: Joi.date().iso().optional(),
      userId: Joi.number().integer().positive().optional(),
      user_id: Joi.number().integer().positive().optional(),
      userName: Joi.string().trim().optional(),
      mobileNumber: Joi.string().trim().optional(),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    const parseBooleanInput = (booleanValue) => {
      if (booleanValue === undefined) {
        return undefined;
      }

      if (typeof booleanValue === "boolean") {
        return booleanValue;
      }

      return booleanValue === "true" || booleanValue === "1";
    };

    const normalizedPayload = {
      ...value,
      abuserId: value.abuserId || value.abuser_id,
      userId: value.userId || value.user_id,
      abuseType: value.abuseType || value.abuse_type,
      threatLevel: value.threatLevel || value.threat_level,
      history_of_violence: parseBooleanInput(value.history_of_violence),
      weapon_access: parseBooleanInput(value.weapon_access),
      restraining_order: parseBooleanInput(value.restraining_order),
    };

    return new Promise((resolve) => {
      AdminService.getAbusersWithReportStats({ payload: normalizedPayload, headers }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "GET_ABUSERS_WITH_REPORT_STATS_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("GET_ABUSERS_WITH_REPORT_STATS_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }

  static async contactAdmin(request) {
    const { payload, headers, user } = request;
    const userId = user?.id;

    const schema = Joi.object({
      message: Joi.string().trim().min(1).required().messages({
        "string.base": headers?.i18n.__("MESSAGE_MUST_BE_STRING"),
        "string.empty": headers?.i18n.__("MESSAGE_REQUIRED"),
        "string.min": headers?.i18n.__("MESSAGE_REQUIRED"),
        "any.required": headers?.i18n.__("MESSAGE_REQUIRED"),
      }),
    });

    const { error, value } = schema.validate(payload);
    if (error) {
      return {
        status: 400,
        data: null,
        error: {
          message: headers?.i18n.__(error.details[0].message || "VALIDATION_ERROR"),
          reason: error.details[0].message,
        },
      };
    }

    return new Promise((resolve) => {
      AdminService.contactAdmin({ userId, payload: value }, (err, response) => {
        if (err) {
          return resolve({
            status: 400,
            data: null,
            error: {
              message: headers?.i18n.__(err.message || "CONTACT_ADMIN_FAILED"),
              reason: err.message,
            },
          });
        }

        return resolve({
          status: 200,
          data: response.data,
          message: headers?.i18n.__("CONTACT_ADMIN_SUCCESSFUL"),
          error: null,
        });
      });
    });
  }
}
