import joi from "joi";

export const peleCardValidator = async (data, i18n) => {
  try {
    //add i18n messages to joi schema
    const supportedCardRegex = [
      /^3[47]\d{13}$/, // amex (15 digits)
      /^(?:6011|65\d{2}|64[4-9]\d)\d{12}$/, // discover (16 digits)
      /^3(?:0[0-5]|09|[689]\d)\d{11}$/, // diners (14 digits)
      /^(5[1-5]|2[2-7])\d{14}$/, // mastercard (16 digits)
      /^(5019|4175|4571)\d{12}$/, // dankort (16 digits)
      /^63[7-9]\d{13}$/, // instapayment (16 digits)
      /^(2131|1800)\d{11}$/, // jcb15 (15 digits)
      /^35\d{14}$/, // jcb (16 digits)
      /^(5[0678]|6304|67)\d{12,15}$/, // maestro (12–19 digits)
      /^220[0-4]\d{12}$/, // mir (16 digits)
      /^4\d{12,15}$/, // visa (13–16 digits)
      /^62\d{14,17}$/, // unionpay (16–19 digits)
    ];
    const schema = joi.object({
      cardholderName: joi
        .string()
        .min(2)
        .max(50)
        .required()
        .messages({
          "string.base": i18n.__("CARDHOLDER_NAME_STRING"),
          "string.empty": i18n.__("CARDHOLDER_NAME_REQUIRED"),
          "string.min": i18n.__("CARDHOLDER_NAME_MIN_LENGTH"),
          "string.max": i18n.__("CARDHOLDER_NAME_MAX_LENGTH"),
          "any.required": i18n.__("CARDHOLDER_NAME_REQUIRED"),
        }),

      cardNumber: joi
        .string()
        .pattern(new RegExp(supportedCardRegex.map((r) => r.source).join("|")))
        .required()
        .messages({
          "string.pattern.base": i18n.__("CARD_NUMBER_STRING"),
          "string.empty": i18n.__("CARD_NUMBER_REQUIRED"),
          "any.required": i18n.__("CARD_NUMBER_REQUIRED"),
        }),

      creditCardDateMmYy: joi
        .string()
        .pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
        .required()
        .messages({
          "string.pattern.base": i18n.__("EXPIRATION_DATE_FORMAT"),
          "string.empty": i18n.__("EXPIRATION_DATE_REQUIRED"),
          "any.required": i18n.__("EXPIRATION_DATE_REQUIRED"),
        }),

      cvv: joi
        .string()
        .pattern(/^\d{3,4}$/)
        .required()
        .messages({
          "string.pattern.base": i18n.__("CVV_STRING"),
          "string.empty": i18n.__("CVV_REQUIRED"),
          "any.required": i18n.__("CVV_REQUIRED"),
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
