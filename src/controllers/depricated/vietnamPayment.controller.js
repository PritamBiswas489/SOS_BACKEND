import fs from "fs";
import "../config/environment.js";
import VietnamPaymentService from "../services/vietnamPaymentService.js";
import { buildDecryptRequest } from "../services/crypto.server.js";
import { buildAes256GcmEncryptRequest } from "../services/crypto.client.service.js";
import FavouriteQrCodeService from "../services/favouriteQrCode.service.js";
export default class VietnamPaymentController {
  static async ninePayIpn(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    console.log("============== Received NinePay IPN ==============");

    if (payload?.request_id) {
      await VietnamPaymentService.updateTransactionStatus(payload, i18n);
    }
  }
  //decode Qr code
  static async decodeQrCode(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const qrCode = payload?.qrCode || null;

    return new Promise((resolve) => {
      VietnamPaymentService.decodeQrCode({ qrCode }, (err, response) => {
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
      });
    });
  }
  static async cryptoDecodeQrCode(request) {
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

    return new Promise((resolve) => {
      VietnamPaymentService.decodeQrCode({ qrCode }, (err, response) => {
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
      });
    });
  }
  static async buyExpense(request) {
    const {
      headers: { i18n, deviceLocation },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;

    const deviceLocationLatLng = deviceLocation || "";
    console.log("Device location from headers:", deviceLocationLatLng);
    if (deviceLocationLatLng) {
      const [latitude, longitude] = deviceLocationLatLng.split(",");
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    return new Promise((resolve) => {
      VietnamPaymentService.buyExpense(
        { userId, payload, i18n },
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
      VietnamPaymentService.buyExpense(
        { userId, payload: decryptRequest, i18n },
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
  //Get Expense Transaction Details
  static async getExpenseTransactionDetails(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;
    const { request_id } = payload || {};
    console.log(
      "Getting expense transaction details with payload:",
      payload,
      "for user ID:",
      userId
    );

    return new Promise((resolve) => {
      VietnamPaymentService.getExpenseTransactionDetails(
        { request_id, userId, i18n },
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
    static async getExpensesTransactions(request) {
      const {
        headers: { i18n },
        user,
        payload,
      } = request;
  
      const userId = user?.id || 1;
  
      return new Promise((resolve) => {
         VietnamPaymentService.getExpensesTransactions(
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
  //get expense report for user
  static async getExpensesReport(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;

    return new Promise((resolve) => {
       VietnamPaymentService.getExpensesReport(
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

      payload.country = "VN";
      return new Promise((resolve) => {
        FavouriteQrCodeService.addFavouriteQrCode(
          { userId, payload, i18n },
          (err, response) => {
            if (err) {
              return resolve({
                status: 400,
                data: null,
                error: {
                  message: i18n.__(err.message || "MARK_TRANSACTION_AS_FAVORITE_FAILED"),
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
