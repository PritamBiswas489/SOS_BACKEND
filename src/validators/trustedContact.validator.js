import joi from "joi";

export const sendTrustedContactInvitationValidator = async (data, i18n) => {
  try {
    const phoneRegex = /^\+\d{1,3}\d{4,14}$/;

    const schema = joi.object({
      name: joi.string().trim().min(2).max(100).required().messages({
        "string.empty": i18n.__("TRUSTED_CONTACT_NAME_REQUIRED"),
        "string.min": i18n.__("TRUSTED_CONTACT_NAME_MIN_LENGTH"),
        "string.max": i18n.__("TRUSTED_CONTACT_NAME_MAX_LENGTH"),
        "any.required": i18n.__("TRUSTED_CONTACT_NAME_REQUIRED"),
      }),
      mobile_number: joi.string().trim().pattern(phoneRegex).required().messages({
        "string.empty": i18n.__("MOBILE_NUMBER_REQUIRED"),
        "string.pattern.base": i18n.__("INVALID_PHONE_NUMBER_FORMAT"),
        "any.required": i18n.__("MOBILE_NUMBER_REQUIRED"),
      }),
      relationship: joi.string().trim().min(2).max(50).required().messages({
        "string.empty": i18n.__("RELATIONSHIP_REQUIRED"),
        "string.min": i18n.__("RELATIONSHIP_MIN_LENGTH"),
        "string.max": i18n.__("RELATIONSHIP_MAX_LENGTH"),
        "any.required": i18n.__("RELATIONSHIP_REQUIRED"),
      }),
      sos_alert: joi.boolean().optional().messages({
        "boolean.base": i18n.__("INVALID_SOS_ALERT_VALUE"),
      }),
      share_location: joi.boolean().optional().messages({
        "boolean.base": i18n.__("INVALID_SHARE_LOCATION_VALUE"),
      }),
    });

    return [null, await schema.validateAsync(data)];
  } catch (e) {
    if (e.details) {
      const errRes = {
        status: 400,
        data: [],
        error: { message: e.details[0].message },
      };
      return [errRes, null];
    }

    return [
      {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      },
      null,
    ];
  }
};