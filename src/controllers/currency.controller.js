import db from "../databases/models/index.js";
import "../config/environment.js";
import axios from "axios";
import CurrencyService from "../services/currency.service.js";
import * as Sentry from "@sentry/node";
import { paymentCurrencies } from "../config/paymentCurrencies.js";
import { walletCurrencies } from "../config/walletCurrencies.js";

export default class CurrencyController {
  static async fixerExchangeRates(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const apiKey = process.env.FIXER_API_KEY;

      const response = await axios.get("http://data.fixer.io/api/latest", {
        params: {
          access_key: apiKey,
          symbols: [...Object.keys(paymentCurrencies), ...Object.keys(walletCurrencies)].join(","),
        },
      });

      const rates = response.data.rates;

      const currencies = [...Object.keys(paymentCurrencies), ...Object.keys(walletCurrencies)];
      const result = {};

      // EUR to each currency
      currencies.forEach((cur) => {
        result[`EUR_TO_${cur}`] = rates[cur];
        result[`${cur}_TO_EUR`] = 1 / rates[cur];
      });

      // Each pair conversion
      currencies.forEach((from) => {
        currencies.forEach((to) => {
          if (from !== to) {
            result[`${from}_TO_${to}`] = rates[to] / rates[from];
          }
        });
      });

      const insertOrUpdateCurrencyResult =
        await CurrencyService.insertOrUpdateCurrency(result);
      return {
        status: 200,
        data: result,
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

  static async getCurrencyByCode(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const { code } = payload;
      const currency = await CurrencyService.getCurrencyByCode(code);
      return {
        status: 200,
        data: currency.data || [],
        message: i18n.__("CURRENCY_RETRIEVED_SUCCESSFULLY"),
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

  static async getAllCurrencies(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const currencies = await CurrencyService.getAllCurrencies();
      return {
        status: 200,
        data: currencies.data || [],
        message: i18n.__("CURRENCY_RETRIEVED_SUCCESSFULLY"),
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
  static async convertFromTHB(request) {
    const {
      payload,
      headers: { i18n },
    } = request;

    try {
      const { amount, toCurrency } = payload;
      if (!Array.isArray(toCurrency) || toCurrency.length === 0) {
        return {
          status: 400,
          data: [],
          error: {
            message: i18n.__("INVALID_CURRENCY_CODE"),
            reason: i18n.__("CURRENCY_CODE_ARRAY_REQUIRED"),
          },
        };
      }

      const supportedCurrencies = Object.keys(walletCurrencies);
      const unsupported = toCurrency.filter(
        (cur) => !supportedCurrencies.includes(cur)
      );
      if (unsupported.length > 0) {
        return {
          status: 400,
          data: [],
          error: {
            message: i18n.__("INVALID_CURRENCY_CODE"),
            reason: i18n.__("CURRENCY_NOT_SUPPORTED", {
              currency: unsupported.join(", "),
            }),
          },
        };
      }
      const result = await CurrencyService.convertFromTHB(amount, toCurrency);
      if (result?.ERROR) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("CURRENCY_CONVERSION_FAILED"),
            reason: result.ERROR,
          },
        };
      }
      return {
        status: 200,
        data: result.data || [],
        message: i18n.__("CURRENCY_CONVERSION_SUCCESSFUL"),
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
  static async convertToTHB(request) {
    const {
      payload,
      headers: { i18n },
    } = request;

    try {
      const { amount, fromCurrency } = payload;
      if (!Array.isArray(fromCurrency) || fromCurrency.length === 0) {
        return {
          status: 400,
          data: [],
          error: {
            message: i18n.__("INVALID_CURRENCY_CODE"),
            reason: i18n.__("CURRENCY_CODE_ARRAY_REQUIRED"),
          },
        };
      }

      const supportedCurrencies = Object.keys(walletCurrencies);
      const unsupported = fromCurrency.filter(
        (cur) => !supportedCurrencies.includes(cur)
      );
      if (unsupported.length > 0) {
        return {
          status: 400,
          data: [],
          error: {
            message: i18n.__("INVALID_CURRENCY_CODE"),
            reason: i18n.__("CURRENCY_NOT_SUPPORTED", {
              currency: unsupported.join(", "),
            }),
          },
        };
      }
      const result = await CurrencyService.convertToTHB(amount, fromCurrency);
      if (result?.ERROR) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("CURRENCY_CONVERSION_FAILED"),
            reason: result.ERROR,
          },
        };
      }
      return {
        status: 200,
        data: result.data || [],
        message: i18n.__("CURRENCY_CONVERSION_SUCCESSFUL"),
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
  static async currencyConverterWalletCurToPaymentCur(request) {
    const {
      payload,
      headers: { i18n },
    } = request;

    const { fromCurrency, toCurrency, amount } = payload;
    const supportedFromCurrencies = Object.keys(walletCurrencies);
    const supportedToCurrencies = Object.keys(paymentCurrencies);

    if (!supportedFromCurrencies.includes(fromCurrency)) {
      return {
        status: 400,
        data: [],
        error: {
          message: i18n.__("INVALID_FROM_CURRENCY_CODE"),
          reason: i18n.__("INVALID_FROM_CURRENCY_CODE", {
            currency: fromCurrency,
          }),
        },
      };
    }
    if (!supportedToCurrencies.includes(toCurrency)) {
      return {
        status: 400,
        data: [],
        error: {
          message: i18n.__("INVALID_TO_CURRENCY_CODE"),
          reason: i18n.__("INVALID_TO_CURRENCY_CODE", {
            currency: toCurrency,
          }),
        },
      };
    }

    return new Promise((resolve) => {
      CurrencyService.currencyConverterWalletCurToPaymentCur(
        fromCurrency,
        toCurrency,
        amount,
        (err, result) => {
          if (err || result?.ERROR) {
            process.env.SENTRY_ENABLED === "true" &&
              Sentry.captureException(err || result.ERROR);
            resolve({
              status: 500,
              data: [],
              error: {
                message: i18n.__("CURRENCY_CONVERSION_FAILED"),
                reason: err ? err.message : result.ERROR,
              },
            });
          } else {
            resolve({
              status: 200,
              data: result.data || [],
              message: i18n.__("CURRENCY_CONVERSION_SUCCESSFUL"),
              error: {},
            });
          }
        }
      );
    });
    
  }
  static async currencyConverterPaymentCurToWalletCur(request) {
      const {
      payload,
      headers: { i18n },
    } = request;

    const { fromCurrency, toCurrency, amount } = payload;
    const supportedToCurrencies = Object.keys(walletCurrencies);
    const supportedFromCurrencies = Object.keys(paymentCurrencies);

    // if (!supportedFromCurrencies.includes(fromCurrency)) {
    //   return {
    //     status: 400,
    //     data: [],
    //     error: {
    //       message: i18n.__("INVALID_FROM_CURRENCY_CODE"),
    //       reason: i18n.__("INVALID_FROM_CURRENCY_CODE", {
    //         currency: fromCurrency,
    //       }),
    //     },
    //   };
    // }
    // if (!supportedToCurrencies.includes(toCurrency)) {
    //   return {
    //     status: 400,
    //     data: [],
    //     error: {
    //       message: i18n.__("INVALID_TO_CURRENCY_CODE"),
    //       reason: i18n.__("INVALID_TO_CURRENCY_CODE", {
    //         currency: toCurrency,
    //       }),
    //     },
    //   };
    // }

    return new Promise((resolve) => {
      CurrencyService.currencyConverterPaymentCurToWalletCur(
        fromCurrency,
        toCurrency,
        amount,
        (err, result) => {
          if (err || result?.ERROR) {
            process.env.SENTRY_ENABLED === "true" &&
              Sentry.captureException(err || result.ERROR);
            resolve({
              status: 500,
              data: [],
              error: {
                message: i18n.__("CURRENCY_CONVERSION_FAILED"),
                reason: err ? err.message : result.ERROR,
              },
            });
          } else {
            resolve({
              status: 200,
              data: result.data || [],
              message: i18n.__("CURRENCY_CONVERSION_SUCCESSFUL"),
              error: {},
            });
          }
        }
      );
    });

  }
  static async getBankHapoalimExchangeRate(request) {
    const {
      payload,
      headers: { i18n },
    } = request;

    try {
      const exchangeRate = await CurrencyService.getBankHapoalimExchangeRate();
      if (exchangeRate.error) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("EXCHANGE_RATE_FETCH_FAILED"),
            reason: exchangeRate.error,
          },
        };
      }
      return {
        status: 200,
        data: exchangeRate,
        message: i18n.__("EXCHANGE_RATE_FETCH_SUCCESSFUL"),
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
