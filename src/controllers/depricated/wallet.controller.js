import "../config/environment.js";
import * as Sentry from "@sentry/node";
import WalletService from "../services/wallet.service.js";
export default class WalletController {
  static async getUserWallet(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const { currency } = payload;
      console.log("currency", currency);
      const userWallet = await WalletService.getUserWallet(user.id, currency);
      if (userWallet?.ERROR) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("GET_USER_WALLET_FAILED"),
            reason: userWallet.ERROR,
          },
        };
      }
      return {
        status: 200,
        data: userWallet,
        message: i18n.__("USER_WALLET_FETCHED_SUCCESSFULLY"),
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
  static async getUserWalletAllCurrencies(request){
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const userWallet = await WalletService.getUserWalletAllCurrencies(user.id);
      if (userWallet?.ERROR) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("GET_USER_WALLET_FAILED"),
            reason: userWallet.ERROR,
          },
        };
      }
      return {
        status: 200,
        data: userWallet,
        message: i18n.__("USER_WALLET_FETCHED_SUCCESSFULLY"),
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
  static async getUserWalletTransactionHistory(request) {
      const {
        payload,
        headers: { i18n },
        user,
      } = request;
      try {
        const {  filter, page, limit } = payload;
        const userWalletTransactionHistory = await WalletService.getUserWalletTransactionHistory(user.id, { filter, page, limit });
        if (userWalletTransactionHistory?.ERROR) {
          return {
            status: 500,
            data: [],
            error: {
              message: i18n.__("GET_USER_WALLET_TRANSACTION_HISTORY_FAILED"),
              reason: userWalletTransactionHistory.ERROR,
            },
          };
        }
        return {
          status: 200,
          data: userWalletTransactionHistory,
          message: i18n.__("USER_WALLET_TRANSACTION_HISTORY_FETCHED_SUCCESSFULLY"),
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
