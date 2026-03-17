import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import PisoPayApiService from "../services/pisoPayApi.service.js";
import PhilippinesPaymentService from "../services/philippinesPayment.service.js";
import { buildDecryptRequest } from "../services/crypto.server.js";
import { buildAes256GcmEncryptRequest } from "../services/crypto.client.service.js";
import FavouriteQrCodeService from "../services/favouriteQrCode.service.js";

export default class PhilippinesPaymentController {
  static async getToken() {
    const responseToken = await PisoPayApiService.login();
    if (responseToken?.token) {
      return { status: 200, data: responseToken, message: "", error: {} };
    } else {
      return {
        status: 500,
        error: "Unable to retrieve token",
        data: {},
        message: "",
      };
    }
  }
  //Validate PisoPay Transaction
  static async validatePisoPayTransaction(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const qrCode = payload?.qrCode || null;
    const responseToken = await PisoPayApiService.login();
    if (!responseToken?.token) {
      return {
        status: 500,
        error: "Unable to retrieve token",
        data: {},
        message: "",
      };
    }

    return new Promise((resolve) => {
      PisoPayApiService.validateTransaction(
        { token: responseToken?.token, qrCode, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "PAYMENT_VALIDATION_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("PAYMENT_VALIDATION_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async cryptoValidatePisoPayTransaction(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;
    const { envelope, sig } = payload;
    const decryptRequest = await buildDecryptRequest({ envelope, sig });
    console.log("Decrypted request:", decryptRequest);
    if (decryptRequest?.error) {
      return {
        status: 400,
        data: null,
        error: {
          message: i18n.__(decryptRequest.error || "PAYMENT_VALIDATION_FAILED"),
          reason: "Encryption failed",
        },
      };
    }
    const qrCode = decryptRequest?.qrCode || null;
    const responseToken = await PisoPayApiService.login();
    if (!responseToken?.token) {
      return {
        status: 500,
        error: "Unable to retrieve token",
        data: {},
        message: "",
      };
    }

    return new Promise((resolve) => {
      PisoPayApiService.validateTransaction(
        { token: responseToken?.token, qrCode, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "PAYMENT_VALIDATION_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: buildAes256GcmEncryptRequest(response.data),
            message: i18n.__("PAYMENT_VALIDATION_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  //Initiate PisoPay Transaction
  static async initiatePisoPayTransaction(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const qrCode = payload?.qrCode || null;
    const amount = payload?.amount || null;
    const responseToken = await PisoPayApiService.login();
    if (!responseToken?.token) {
      return {
        status: 500,
        error: "Unable to retrieve token",
        data: {},
        message: "",
      };
    }

    return new Promise((resolve) => {
      PisoPayApiService.initiateTransaction(
        { token: responseToken?.token, qrCode, amount, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "PAYMENT_INITIATION_FAILED"),
                reason: err.message,
              },
            });
          }
          // PhilippinesPaymentService.trackTransaction(response.data);
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("PAYMENT_INITIATION_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async cryptoBuyExpense(request) {
    const {
      headers: { i18n, deviceLocation },
      user,
      payload,
    } = request;

    const { envelope, sig } = payload;
    const decryptRequest = await buildDecryptRequest({ envelope, sig });
    console.log("Decrypted request:", decryptRequest);
    if (decryptRequest?.error) {
      return {
        status: 400,
        data: null,
        error: {
          message: i18n.__(decryptRequest.error || "BUY_EXPENSE_FAILED"),
          reason: "Encryption failed",
        },
      };
    }
    const userId = user?.id || 1;
    console.log(
      "Crypto Buying expense with payload:",
      decryptRequest,
      "for user ID:",
      userId
    );
    const deviceLocationLatLng = deviceLocation || "";
    console.log("Device location from headers:", deviceLocationLatLng);
    if (deviceLocationLatLng) {
      const [latitude, longitude] = deviceLocationLatLng.split(",");
      decryptRequest.latitude = latitude;
      decryptRequest.longitude = longitude;
    }

    return new Promise((resolve) => {
      PhilippinesPaymentService.buyExpense(
        { payload: decryptRequest, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "BUY_EXPENSE_FAILED"),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: buildAes256GcmEncryptRequest(response.data),
            message: i18n.__("BUY_EXPENSE_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  //Buy Expense using PisoPay
  static async buyExpense(request) {
    const {
      headers: { i18n, deviceLocation },
      user,
      payload,
    } = request;
    const userId = user?.id || 1;
    console.log(
      "Buying expense with payload:",
      payload,
      "for user ID:",
      userId
    );
    const deviceLocationLatLng = deviceLocation || "";
    console.log("Device location from headers:", deviceLocationLatLng);
    if (deviceLocationLatLng) {
      const [latitude, longitude] = deviceLocationLatLng.split(",");
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    return new Promise((resolve) => {
      PhilippinesPaymentService.buyExpense(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "BUY_EXPENSE_FAILED"),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("BUY_EXPENSE_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async getExpensesTransactions(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;

    return new Promise((resolve) => {
      PhilippinesPaymentService.getExpensesTransactions(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "GET_EXPENSES_TRANSACTIONS_FAILED"
                ),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("GET_EXPENSES_TRANSACTIONS_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  //Get Expense Transaction Details
  static async getExpenseTransactionDetails(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;
    const { transaction_info_code } = payload || {};
    console.log(
      "Getting expense transaction details with payload:",
      payload,
      "for user ID:",
      userId
    );

    return new Promise((resolve) => {
      PhilippinesPaymentService.getExpenseTransactionDetails(
        { transaction_info_code, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "GET_EXPENSE_TRANSACTION_DETAILS_FAILED"
                ),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("GET_EXPENSE_TRANSACTION_DETAILS_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  //Callback to update transaction status
  static async callbackTransaction(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    if (payload?.transaction_info_code) {
      await PhilippinesPaymentService.updateTransactionStatus(payload, i18n);
    }
  }
  //get expense report for user
  static async getExpensesReport(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;

    return new Promise((resolve) => {
      PhilippinesPaymentService.getExpensesReport(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "GET_EXPENSES_REPORT_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("GET_EXPENSES_REPORT_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async markTransactionAsFavorite(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;

    payload.country = "PH";
    return new Promise((resolve) => {
      FavouriteQrCodeService.addFavouriteQrCode(
        { userId, payload, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "MARK_TRANSACTION_AS_FAVORITE_FAILED"
                ),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("MARK_TRANSACTION_AS_FAVORITE_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
}