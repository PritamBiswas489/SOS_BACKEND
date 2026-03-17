import db from "../databases/models/index.js";
const { ContactUs, Op } = db;

import { addContactValidator } from "../validators/contact.validator.js";
import * as Sentry from "@sentry/node";

export default class ContactUsController { 
  
  /**
   * Save contact us content
   * @param {*} request 
   * @returns 
   */
  static async saveContent(request) {
    const { payload, headers: { i18n }, user } = request;

    try {
      const insertedData = {
        address: payload.address,
        phoneOne: payload.phoneOne,
        phoneTwo: payload.phoneTwo,
        email: payload.email,
        website: payload.website,
      };

      const [err, validatedData] = await addContactValidator(insertedData, i18n);
      if (err) {
        return err;
      }

      const result = await ContactUs.create(validatedData);

      return {
        status: 200,
        data: payload,
        message: i18n.__("CONTENT_SAVED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  /**
   * List all contact us records
   * @param {*} request
   * @returns
   */
  static async listAll(request) {
    const { payload, headers: { i18n }, user } = request;

    try {
      const result = await ContactUs.findAll();

      return {
        status: 200,
        data: result,
        message: i18n.__("RECORDS_FETCHED_SUCCESSFULLY"),
        error: {},
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
}
