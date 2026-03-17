import joi from 'joi';
 

export const addContactValidator = async (data, i18n) => { // pass `req` to access language
    try {
        const schema = joi.object({
            address: joi.string().required().messages({
				'string.empty': i18n.__('ADDRESS_REQUIRED'),
                'any.required': i18n.__('ADDRESS_REQUIRED' )
            }),
            phoneOne: joi.string().required().messages({
				'string.empty': i18n.__('PHONE_ONE_REQUIRED'),
                'any.required': i18n.__('PHONE_ONE_REQUIRED')
            }),
            phoneTwo: joi.string().optional().allow('', null),
            email: joi.string().email().required().messages({
				'string.empty': i18n.__('EMAIL_REQUIRED'),
                'any.required': i18n.__('EMAIL_REQUIRED'),
                'string.email': i18n.__('INVALID_EMAIL_FORMAT')
            }),
            website: joi.string().uri().optional().allow('', null).messages({
                'string.uri': i18n.__('INVALID_WEBSITE_URL')
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
        return [{ status: 500, data: [], error: { message: i18n.__('CATCH_ERROR'), reason: e.message } }, null];
    }
};
