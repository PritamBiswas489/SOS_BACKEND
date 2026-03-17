import joi from "joi";

export const profileEditValidator = async (data, i18n) => {
  try {
    //add message attribute in joi schema to customize error messages
  const schema = joi.object({
    name: joi.string().allow('').min(3).max(50).optional().messages({
      'string.min': i18n.__('NAME_MIN_LENGTH'),
      'string.max': i18n.__('NAME_MAX_LENGTH'),
    }),
    email: joi.string().allow('').email().optional().messages({
      'string.email': i18n.__('INVALID_EMAIL_FORMAT')
    }),
    address: joi.string().allow('').max(255).optional(),
    dob: joi.string().allow('').isoDate().optional(),
    language: joi.string().allow('').valid('en', 'he').default('he').optional().messages({
      'any.only': i18n.__('INVALID_LANGUAGE'),
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
