import joi from "joi";

export const peleAddToWalletValidator = async (data, i18n) => {
  try {
    //add i18n messages to joi schema
    const schema = joi.object({
      amount: joi.number().positive().required().messages({
      "number.base": i18n.__("AMOUNT_MUST_BE_NUMBER"),
      "number.positive": i18n.__("AMOUNT_GREATER_THAN_ZERO"),
      "any.required": i18n.__("AMOUNT_REQUIRED"),
      }),

      fromCurrency: joi
      .string()
      .required()
      .custom((value, helpers) => {
        const { number_of_payment } = helpers.state.ancestors[0];
        if (number_of_payment > 1) {
        if (value !== "ILS") {
          return helpers.error("any.onlyILS");
        }
        } else {
        if (!["USD", "EUR", "ILS"].includes(value)) {
          return helpers.error("any.only");
        }
        }
        return value;
      })
      .messages({
        "any.onlyILS": i18n.__("ONLY_ILS_ALLOWED_FOR_MULTIPLE_PAYMENTS"),
        "any.only": i18n.__("ONLY_USD_EUR_ILS_ACCEPTED"),
        "string.empty": i18n.__("CURRENCY_REQUIRED"),
        "any.required": i18n.__("CURRENCY_REQUIRED"),
      }),

      cardToken: joi.string().required().messages({
      "string.base": i18n.__("CARD_TOKEN_STRING"),
      "string.empty": i18n.__("CARD_TOKEN_REQUIRED"),
      "any.required": i18n.__("CARD_TOKEN_REQUIRED"),
      }),

      number_of_payment: joi.number().integer().required().messages({
      "number.base": i18n.__("NUMBER_OF_PAYMENT_MUST_BE_NUMBER"),
      "number.integer": i18n.__("NUMBER_OF_PAYMENT_MUST_BE_INTEGER"),
      "any.required": i18n.__("NUMBER_OF_PAYMENT_REQUIRED"),
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
