import joi from "joi";

export const updatepinValidator = async (data, i18n) => {
  try {
   
    const otpRegex = /^\d{4}$/; // Example regex for 4-digit OTP codes

    const schema = joi.object({
     existingPinCode: joi.string().pattern(otpRegex).required().messages({
        "string.pattern.base": i18n.__("EXISTING_INVALID_OTP_FORMAT"),
        "any.required": i18n.__("EXISTING_OTP_REQUIRED"),
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
        error: { message: "Something went wrong !", reason: e.message },
      },
      null,
    ];
  }
};
