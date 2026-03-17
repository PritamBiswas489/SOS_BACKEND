import "../config/environment.js";
import KessPayApiService from "../services/kesspayApi.service.js";
import CambodiaPaymentService from "../services/cambodiaPayment.service.js";
import { buildDecryptRequest } from "../services/crypto.server.js";
import { buildAes256GcmEncryptRequest } from "../services/crypto.client.service.js";
import FavouriteQrCodeService from "../services/favouriteQrCode.service.js";
export default class CambodiaPaymentController {
  static async getToken() {
    const responseToken = await KessPayApiService.accessToken();
    if (responseToken?.access_token) {
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
  //decode KHQR
  static async decodeKHQR(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const qrCode = payload?.qrcode || null;
    const responseToken = await KessPayApiService.accessToken();
    if (!responseToken?.access_token) {
      return {
        status: 500,
        error: "Unable to retrieve token",
        data: {},
        message: "",
      };
    }

    return new Promise((resolve) => {
      KessPayApiService.decodeKHQR(
        { token: responseToken?.access_token, qrCode, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "DECODE_QRCODE_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("DECODE_QRCODE_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }

  static async cryptoDecodeKHQR(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const { envelope, sig } = payload;
    const decryptRequest = await buildDecryptRequest({ envelope, sig });
    if (decryptRequest?.error) {
      return {
        status: 400,
        data: null,
        error: {
          message: i18n.__(decryptRequest.error || "DECODE_QRCODE_FAILED"),
          reason: "Decryption failed",
        },
      };
    }

    const qrCode = decryptRequest?.qrcode || null;
    const responseToken = await KessPayApiService.accessToken();
    if (!responseToken?.access_token) {
      return {
        status: 500,
        error: "Unable to retrieve token",
        data: {},
        message: "",
      };
    }

    return new Promise((resolve) => {
      KessPayApiService.decodeKHQR(
        { token: responseToken?.access_token, qrCode, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "DECODE_QRCODE_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: buildAes256GcmEncryptRequest(response.data),
            message: i18n.__("DECODE_QRCODE_SUCCESSFUL"),
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
    const deviceLocationLatLng = deviceLocation || "";
    console.log("Device location from headers:", deviceLocationLatLng);
    if (deviceLocationLatLng) {
      const [latitude, longitude] = deviceLocationLatLng.split(",");
      decryptRequest.latitude = latitude;
      decryptRequest.longitude = longitude;
    }
    return new Promise((resolve) => {
      CambodiaPaymentService.buyExpense(
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
  //Buy Expense
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

    console.log(
      "Buying expense with payload:",
      payload,
      "for user ID:",
      userId
    );

    return new Promise((resolve) => {
      CambodiaPaymentService.buyExpense(
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
  static async getExpenseTransactionDetails(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;
    const { id } = payload || {};
    console.log(
      "Getting expense transaction details with payload:",
      payload,
      "for user ID:",
      userId
    );

    return new Promise((resolve) => {
      CambodiaPaymentService.getExpenseTransactionDetails(
        { id, userId, i18n },
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
      CambodiaPaymentService.getExpensesTransactions(
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
      CambodiaPaymentService.getExpensesReport(
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

    payload.country = "KH";
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

  static async createUser(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;
    const userId = user?.id || 1;
    return new Promise((resolve) => {
      CambodiaPaymentService.createUser(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "CREATE_USER_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("CREATE_USER_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }

  static async updateKyc(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;

    return new Promise((resolve) => {
      CambodiaPaymentService.updateKyc(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "UPDATE_KYC_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("UPDATE_KYC_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async checkKycStatus(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;

    const userId = user?.id || 1;

    return new Promise((resolve) => {
      CambodiaPaymentService.checkKycStatus(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "CHECK_KYC_STATUS_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("CHECK_KYC_STATUS_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async kycUserDetails(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;
    const userId = user?.id || 1;
    return new Promise((resolve) => {
      CambodiaPaymentService.kycUserDetails(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "GET_USER_DETAILS_FAILED"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("GET_USER_DETAILS_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
}