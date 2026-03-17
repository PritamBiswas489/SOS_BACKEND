import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import SettingsService from "./settings.service.js";
import { amountUptotwoDecimalPlaces } from "../libraries/utility.js";
import { where } from "sequelize";
import { formatDateToTimezone } from "../libraries/utility.js";

const { Currency, Op, BankhapoalimExchangeRate } = db;

export default class CurrencyService {
  static async insertOrUpdateCurrency(data) {
    try {
      const codes = Object.keys(data);

      const existingCurrencies = await Currency.findAll({
        where: { code: { [Op.in]: codes } },
      });

      const existingMap = {};
      existingCurrencies.forEach((currency) => {
        existingMap[currency.code] = currency;
      });

      for (let code of codes) {
        if (existingMap[code]) {
          await Currency.update(
            { value: data[code] },
            { where: { id: existingMap[code].id } }
          );
        } else {
          await Currency.create({
            code: code,
            value: data[code],
          });
        }
      }

      return { SUCCESS: 1 };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: e.message };
    }
  }

  static async getCurrencyByCode(code) {
    try {
      const currency = await Currency.findOne({ where: { code } });
      if (!currency) {
        return { ERROR: 1 };
      }
      return { data: currency };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }

  static async getAllCurrencies() {
    try {
      const currencies = await Currency.findAll();
      return { data: currencies };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }
  static async convertToTHB(amount, fromCurrency = []) {
    try {
      const results = await Promise.all(
        fromCurrency.map(async (fCur, index) => {
          const currency = await Currency.findOne({
            where: { code: `${fCur}_TO_THB` },
          });

          // console.log("currency", currency);

          if (!currency) {
            return { ERROR: 1 };
          }
          const setting = await SettingsService.getSetting("delta_percentage");
          const rate = currency.value;
          const deltaCutPercentage = parseFloat(setting.data.value) || 0;
          const cutValue = (rate * deltaCutPercentage) / 100;
          const finalRateValue = rate - cutValue;

          const converted_amount_with_delta_percentage =
            amountUptotwoDecimalPlaces(amount * finalRateValue);
          const converted_amount_without_delta_percentage =
            amountUptotwoDecimalPlaces(amount * rate);
          return {
            fromCurrency: fCur,
            amount,
            converted_amount_with_delta_percentage,
            converted_amount_without_delta_percentage,
            rate,
            deltaCutPercentage,
            cutValue,
            finalRateValue,
            updatedTime: formatDateToTimezone(currency.updatedAt),
          };
        })
      );
      return { data: results };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }
  static async convertFromTHB( amount, toCurrency = []) {
    try {
      const results = await Promise.all(
        toCurrency.map(async (tCur, index) => {
          const currency = await Currency.findOne({
            // where: { code: `THB_TO_${tCur}` },
            where: { code: `${tCur}_TO_THB` },
          });

          if (!currency) {
            return { ERROR: 1 };
          }
          const setting = await SettingsService.getSetting("delta_percentage");
          const rate =   currency.value;
          const deltaCutPercentage = parseFloat(setting.data.value) || 0;
          const cutValue = (rate * deltaCutPercentage) / 100;
          const finalRateValue = rate - cutValue;

          const converted_amount_with_delta_percentage =
            amountUptotwoDecimalPlaces(amount * (1/ finalRateValue));
          const converted_amount_without_delta_percentage =
            amountUptotwoDecimalPlaces(amount * (1 / rate));
          return {
            toCurrency: tCur,
            amount,
            converted_amount_with_delta_percentage,
            converted_amount_without_delta_percentage,
            rate : 1 / rate,
            deltaCutPercentage,
            cutValue,
            finalRateValue : 1 / finalRateValue,
            updatedTime: formatDateToTimezone(currency.updatedAt),
          };
        })
      );
      return { data: results };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: 1 };
    }
  }

  static async currencyConverterWalletCurToPaymentCur(fromCurrency, toCurrency, amount, callback) {
    try {
      const currency = await Currency.findOne({
      where: { code: `${fromCurrency}_TO_${toCurrency}` },
      });

      if (!currency) {
      return callback({ ERROR: 1 }, null);
      }
      const setting = await SettingsService.getSetting("delta_percentage");
      const rate = currency.value;
      const deltaCutPercentage = parseFloat(setting.data.value) || 0;
      const cutValue = (rate * deltaCutPercentage) / 100;
      const finalRateValue = rate - cutValue;

      const converted_amount_with_delta_percentage =
      amountUptotwoDecimalPlaces(amount * finalRateValue);
      const converted_amount_without_delta_percentage =
      amountUptotwoDecimalPlaces(amount * rate);

      return callback(null, {
      data: {
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        amount,
        converted_amount_with_delta_percentage,
        converted_amount_without_delta_percentage,
        rate,
        deltaCutPercentage,
        cutValue,
        finalRateValue,
        updatedTime: formatDateToTimezone(currency.updatedAt),
      },
      });
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return callback({ ERROR: 1 }, null);
    }

  }
  static async currencyConverterPaymentCurToWalletCur(fromCurrency, toCurrency, amount, callback) {
      

    try {
      let rate = 1;
      let currency = null;
      if (fromCurrency !== toCurrency) {
        currency = await Currency.findOne({
          where: { code: `${toCurrency}_TO_${fromCurrency}` },
        });

        if (!currency) {
          return callback({ ERROR: 1 }, null);
        }
        rate = currency.value;
      }
     
      
      const setting = await SettingsService.getSetting("delta_percentage");

      let deltaCutPercentage = parseFloat(setting.data.value) || 0;
      if(rate === 1){
        deltaCutPercentage = 0;
      }
      const cutValue = (rate * deltaCutPercentage) / 100;
      const finalRateValue = rate - cutValue;

      

      const converted_amount_with_delta_percentage =
      amountUptotwoDecimalPlaces(amount * (1 / finalRateValue));
      const converted_amount_without_delta_percentage =
      amountUptotwoDecimalPlaces(amount * (1 / rate));
      return callback(null, {
      data: {
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        amount,
        converted_amount_with_delta_percentage:  parseFloat(converted_amount_with_delta_percentage) === 0 ? 0.01 : converted_amount_with_delta_percentage,
        converted_amount_without_delta_percentage : parseFloat(converted_amount_without_delta_percentage) === 0 ? 0.01 : converted_amount_without_delta_percentage,
        rate: 1 / rate,
        deltaCutPercentage,
        cutValue,
        finalRateValue: 1 / finalRateValue,
        updatedTime: currency?.updatedAt ? formatDateToTimezone(currency?.updatedAt) : null ,
      },
      });
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return callback({ ERROR: 1 }, null);
    }

  }


  static async bankhapoalimExchangeRateUpdate(data) {
    try {
      const codes = [
        "ILS_TO_THB",
        "THB_TO_ILS",
      ];

      const existingCurrencies = await BankhapoalimExchangeRate.findAll({
        where: { code: { [Op.in]: codes } },
      });

      const existingMap = {};
      existingCurrencies.forEach((currency) => {
        existingMap[currency.code] = currency;
      });

      for (let code of codes) {
        if (existingMap[code]) {
          await BankhapoalimExchangeRate.update(
            { value: data[code] },
            { where: { id: existingMap[code].id } }
          );
        } else {
          await BankhapoalimExchangeRate.create({
            code: code,
            value: data[code],
          });
        }
      }

      return { SUCCESS: 1 };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: e.message };
    }
  }

  static async getBankHapoalimExchangeRate() {
    try {
      const exchangeRate = await BankhapoalimExchangeRate.findAll();
      if (!exchangeRate || exchangeRate.length === 0) {
        return { ERROR: "No exchange rate found" };
      }
      return exchangeRate;
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: e.message };
    }
  }
}
