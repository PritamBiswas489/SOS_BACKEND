import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { InterestRates, Op, User } = db;

export default class InterestRatesService {
  static async getInterestRates() {
    try {
      const interestRates = await InterestRates.findAll({
        order: [["paymentNumber", "ASC"]],
      });
      return { SUCCESS: 1, data: interestRates };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }

  static async addInterestRate(paymentNumber, interestRate) {
    try {
      const setting = await InterestRates.findOne({
        where: { paymentNumber: paymentNumber },
      });
      if (setting) {
        // Update existing setting
        await InterestRates.update(
          { interestRate: interestRate },
          { where: { paymentNumber: paymentNumber } }
        );
      } else {
        // Create new setting
        await InterestRates.create({
          paymentNumber: paymentNumber,
          interestRate: interestRate,
        });
      }
      return { SUCCESS: 1 };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }

  static async getInterestRatesByPaymentNumber(paymentNumber) {
      try {
        const setting = await InterestRates.findOne({ where: { paymentNumber: paymentNumber } });
          if (setting) {
              return { SUCCESS: 1, data: setting };
          } else {
              return { ERROR: 1, message: "Setting not found" };
          }
      } catch (e) {
        process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
        return { ERROR: 1 };
      }
  
  }
}
