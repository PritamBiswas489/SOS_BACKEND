import joi from "joi";

export const setNewPinValidator = async (data, i18n) => {
  try {
    const phoneRegex = /^\+\d{1,3}\d{4,14}$/; // Example regex for international phone numbers
    const otpRegex = /^\d{4}$/; // Example regex for 4-digit OTP codes


    //add i18n messages to joi schema
    const schema = joi.object({
      phoneNumber: joi.string().pattern(phoneRegex).required().messages({
        "string.pattern.base":
          i18n.__("INVALID_PHONE_NUMBER_FORMAT"),
        "any.required": i18n.__("PHONE_ONE_REQUIRED"),
      }),
      pinCode: joi.string().pattern(otpRegex).required().messages({
        "string.pattern.base": i18n.__("INVALID_OTP_FORMAT"),
        "any.required": i18n.__("OTP_REQUIRED"),
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
