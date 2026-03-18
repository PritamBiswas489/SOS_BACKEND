import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import axios from "axios";
import { walletCurrencies } from "../config/walletCurrencies.js";
import { paymentCurrencies } from "../config/paymentCurrencies.js";
import PisoPayApiService from "./pisoPayApi.service.js";
import UserService from "./user.service.js";
import CurrencyService from "./currency.service.js";
import { getCalculateP2MOrP2PFromQRCode } from "../libraries/utility.js";
import { where } from "sequelize";
const {
  PisoPayTransactionInfos,
  ExpensesCategories,
  UserWallet,
  WalletTransaction,
  PisopyPaymentErrorLogs,
  Op,
  fn,
  col
} = db;
 


export default class PhilippinesPaymentService {
  //track transaction info
  static async trackTransaction(paymentData, transaction) {
    try {
      const createdRecord = await PisoPayTransactionInfos.create(
        {
          transaction_info_code: paymentData.transaction_info_code,
          transaction_type: paymentData.transaction_type,
          transaction_channel: paymentData.transaction_channel,
          remittance_method_code: paymentData.remittance_method_code,
          sender_customer_code: paymentData.sender_customer_code,
          sender_customer_details: paymentData.sender_customer_details,
          beneficiary_customer_code: paymentData.beneficiary_customer_code,
          beneficiary_customer_details:
            paymentData.beneficiary_customer_details,
          relationship: paymentData.relationship,
          purpose: paymentData.purpose,
          client_fee_rebate_json: paymentData.client_fee_rebate_json,
          amount: paymentData.amount,
          client_fee: paymentData.client_fee,
          client_rebate: paymentData.client_rebate,
          amount_deduct: paymentData.amount_deduct,
          callback_url: paymentData.callback_url,
          qr_code: paymentData.qr_code,
          date_time: paymentData.date_time,
          userId: paymentData.userId,
          expenseCatId: paymentData.expenseCatId,
          memo: paymentData.memo,
          amountInUserWalletCurrency: paymentData.amountInUserWalletCurrency,
          walletCurrency: paymentData.walletCurrency,
          merchantName: paymentData.merchantName,
          merchantCity: paymentData.merchantCity,
          qrCodeType: paymentData.qrCodeType,
          latitude: paymentData.latitude,
          longitude: paymentData.longitude,
          is_fixed_price: paymentData.is_fixed_price,
        },
        { transaction }
      );
      return createdRecord;
    } catch (e) {
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      throw e;
    }
  }
  //update transaction status
  static async updateTransactionStatus(payload, i18n) {
    const { transaction_info_code, status } = payload;
    const record = await PisoPayTransactionInfos.findOne({
      where: { transaction_info_code },
    });
    try {
      const statusMap = {
        0: "Success",
        2: "Cancelled",
        3: "Failed",
      };
      if (!transaction_info_code) {
        return;
      }
      const statusValue = statusMap[parseInt(status)] || "Pending";

      if (!record) throw new Error(`Record not found ${transaction_info_code}`);
      if (record.callBack_data)
        throw new Error(`Call back already processed ${transaction_info_code}`);

      record.transaction_status = statusValue;
      record.callBack_data = payload;
      await record.save();

      if (["Failed", "Cancelled"].includes(statusValue)) {
        console.log(
          `Handling ${statusValue.toLowerCase()} transaction for:`,
          transaction_info_code
        );
        const tran = await db.sequelize.transaction();
        try {
          // throw new Error("Simulated error to test refund logic");
          //refund wallet
          const expenseDet = await ExpensesCategories.findOne({
            where: { id: record.expenseCatId },
          });
          const expenseCatName = expenseDet?.title || "General Expense";

          const userWallet = await UserWallet.findOne({
            where: {
              userId: record.userId,
              currency: record.walletCurrency,
            },
            lock: tran.LOCK.UPDATE,
            transaction: tran,
          });
          if (!userWallet) throw new Error("USER_WALLET_NOT_FOUND");

          const oldWalletBalance = parseFloat(userWallet.balance || 0);
          const amountInUserWalletCurrency =
            parseFloat(record.amountInUserWalletCurrency) || 0;
          const newWalletBalance = parseFloat(
            (oldWalletBalance + amountInUserWalletCurrency).toFixed(6)
          );
          userWallet.balance = newWalletBalance;
          await userWallet.save({ transaction: tran });

          await WalletTransaction.create(
            {
              userId: record.userId,
              walletId: userWallet.id,
              type: "credit",
              paymentAmt: amountInUserWalletCurrency,
              paymentCurrency: record.walletCurrency,
              oldWalletBalance,
              newWalletBalance,
              pisoPayTransactionId: record.id,
              description: i18n.__(
                { phrase: "EXPENSE_PAYMENT_TRANSACTION_FAILED2", locale: "en" },
                {
                  amount: amountInUserWalletCurrency,
                  currency: record.walletCurrency,
                  merchantName: record.merchantName,
                  merchantCity: record.merchantCity,
                  expenseCatName,
                }
              ),
              description_he: i18n.__(
                { phrase: "EXPENSE_PAYMENT_TRANSACTION_FAILED2", locale: "he" },
                {
                  amount: amountInUserWalletCurrency,
                  currency: record.walletCurrency,
                  merchantName: record.merchantName,
                  merchantCity: record.merchantCity,
                  expenseCatName,
                }
              ),
              status: "completed",
            },
            { transaction: tran }
          );
          await tran.commit();
          console.log(
            "Refunded wallet for failed/cancelled transaction:",
            transaction_info_code
          );
        } catch (e) {
          if (tran?.finished !== "commit") await tran.rollback();
          const ERROR_MSG = `Failed to refund wallet for transaction ${transaction_info_code}: ${e.message}`;
          throw new Error(ERROR_MSG);
        }
      }
      console.log("Transaction status updated for:", transaction_info_code);
    } catch (e) {
      const ERROR_MSG = `Failed in Pisopay callback. ${transaction_info_code}: ${e.message}`;
      console.log(ERROR_MSG);
      const createPisopyPaymentErrorLogs = PisopyPaymentErrorLogs.create({
        userId: record?.userId || null,
        errorMessage: ERROR_MSG,
      });
    }
  }
  //buy expense
  static async buyExpense({ payload, userId, i18n }, callback) {
    const tran = await db.sequelize.transaction();
    try {
      console.log(
        "Buying expense with payload:",
        payload,
        "for user ID:",
        userId
      );

      const walletCurrency = payload?.walletCurrency;
      const amount = parseFloat(payload?.amount || 0);
      const qrCode = payload?.qrCode;
      const expenseCatId = payload?.expenseCatId || 1;
      const memo = payload?.memo || "Expense payment";
      const is_fixed_price = payload?.is_fixed_price;

      const expenseDet = await ExpensesCategories.findOne({
        where: { id: expenseCatId },
      });
      if (!expenseDet) {
        callback(new Error("EXPENSE_CATEGORY_NOT_FOUND"), null);
        await tran.rollback();
        return;
      }

      if (walletCurrencies[walletCurrency] === undefined) {
        await tran.rollback();
        return callback(new Error("INVALID_WALLET_CURRENCY"), null);
      }
      if (!amount || amount <= 0) {
        await tran.rollback();
        return callback(new Error("INVALID_AMOUNT"), null);
      }
      if (!qrCode) {
        await tran.rollback();
        return callback(new Error("MISSING_QR_CODE"), null);
      }

      const userWallet = await UserWallet.findOne({
        where: {
          userId: userId,
          currency: walletCurrency,
        },
        lock: tran.LOCK.UPDATE,
        transaction: tran,
      });

      if (!userWallet) {
        await tran.rollback();
        return callback(
          new Error("USER_WALLET_NOT_FOUND_FOR_SELECTED_CURRENCY"),
          null
        );
      }

      const userWalletBalance = parseFloat(userWallet.balance || 0); // balance in selected currency
      const convertActualPaymentAmountToSelectedCurrency = await new Promise(
        (resolve, reject) => {
          CurrencyService.currencyConverterPaymentCurToWalletCur(
            "PHP",
            walletCurrency,
            amount,
            (err, res) => {
              if (err) {
                console.error("Currency conversion error:", err);
                process.env.SENTRY_ENABLED === "true" &&
                  Sentry.captureException(
                    new Error(
                      "Currency converstion failed during buy expense in Pisopay"
                    )
                  );
                reject(err);
              } else {
                resolve(res);
              }
            }
          );
        }
      );
      const actualPaymentAmountToSelectedCurrency = parseFloat(
        convertActualPaymentAmountToSelectedCurrency.data
          .converted_amount_with_delta_percentage
      );
      if (userWalletBalance < actualPaymentAmountToSelectedCurrency) {
        await tran.rollback();
        return callback(new Error("INSUFFICIENT_WALLET_BALANCE"), null);
      }
      console.log({
        amount,
        actualPaymentAmountToSelectedCurrency,
        walletCurrency,
        userWalletBalance,
      });
      const oldWalletBalance = userWalletBalance;
      const newWalletBalance = parseFloat(
        (userWalletBalance - actualPaymentAmountToSelectedCurrency).toFixed(6)
      );
      userWallet.balance = newWalletBalance;
      await userWallet.save({ transaction: tran });

      const responseToken = await PisoPayApiService.login();
      if (!responseToken?.token) {
        await tran.rollback();
        return callback(new Error("TOKEN_RETRIEVAL_FAILED"), null);
      }

      try {
        const qrCodeType = getCalculateP2MOrP2PFromQRCode(qrCode);
        const merchantName = payload?.merchantName;
        const merchantCity = payload?.merchantCity;

        const expenseCatName = expenseDet
          ? expenseDet.title
          : "General Expense";

        console.log(
          "Proceeding with expense payment. Actual payment amount in PHP:",
          amount,
          "which is",
          actualPaymentAmountToSelectedCurrency,
          walletCurrency,
          "User wallet balance:",
          userWalletBalance,
          walletCurrency
        );
        //initiate pisopay transaction
        const initiatePisoPayTransaction = await new Promise(
          (resolve, reject) => {
            PisoPayApiService.initiateTransaction(
              {
                token: responseToken?.token,
                qrCode,
                amount: amount,
                i18n,
                purpose: "EXPENSE_PAYMENT",
              },
              (err, res) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(res);
                }
              }
            );
          }
        );
        const dt = initiatePisoPayTransaction.data;
        Object.assign(dt, {
          userId,
          expenseCatId,
          memo,
          amountInUserWalletCurrency: actualPaymentAmountToSelectedCurrency,
          walletCurrency,
          merchantName,
          merchantCity,
          qrCodeType,
          latitude: payload?.latitude ?? null,
          longitude: payload?.longitude ?? null,
          is_fixed_price,
        });
        //track transaction
        const trackedTransaction = await this.trackTransaction(dt, tran);
        const pisoPayTransactionId = trackedTransaction.id;

        //record wallet transaction
        const walletTransaction = await WalletTransaction.create(
          {
            userId: userId,
            walletId: userWallet.id,
            type: "debit",
            paymentAmt: actualPaymentAmountToSelectedCurrency,
            paymentCurrency: walletCurrency,
            oldWalletBalance: oldWalletBalance,
            newWalletBalance: newWalletBalance,
            pisoPayTransactionId: pisoPayTransactionId,
            description: i18n.__(
              {
                phrase: "EXPENSE_PAYMENT_TRANSACTION_SUCCESSFUL",
                locale: "en",
              },
              {
                amount: actualPaymentAmountToSelectedCurrency,
                currency: walletCurrency,
                merchantName,
                merchantCity,
                expenseCatName,
              }
            ),
            description_he: i18n.__(
              {
                phrase: "EXPENSE_PAYMENT_TRANSACTION_SUCCESSFUL",
                locale: "he",
              },
              {
                amount: actualPaymentAmountToSelectedCurrency,
                currency: walletCurrency,
                merchantName,
                merchantCity,
                expenseCatName,
              }
            ),
            status: "completed",
          },
          { transaction: tran }
        );

        await tran.commit();
        return callback(null, {
          data: { trackedTransaction, walletTransaction },
        });
        // Proceed with the expense payment logic using response
      } catch (err) {
        if (tran?.finished !== "commit") {
          await tran.rollback();
        }
        console.log("QR Code validation failed");
        PisopyPaymentErrorLogs.create({
          userId: userId,
          errorMessage: err.message,
        });
        return callback(err, null);
      }
    } catch (e) {
      if (tran?.finished !== "commit") {
        await tran.rollback();
      }
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      PisopyPaymentErrorLogs.create({
        userId: userId,
        errorMessage: e.message,
      });
      return callback(e, null);
    }
  }
  //get expense transaction details
  static async getExpenseTransactionDetails(
    { transaction_info_code, userId, i18n },
    callback
  ) {
    try {
      const response = await PisoPayTransactionInfos.findOne({
        where: { transaction_info_code, userId },
        include: [
          {
            model: ExpensesCategories,
            as: "expenseCategory",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
        ],
      });
      if (!response) {
        return callback(new Error("EXPENSE_TRANSACTION_NOT_FOUND"), null);
      }
      return callback(null, { data: response });
    } catch (error) {
      console.error("Error fetching expense transaction details:", error);
      return callback(error, null);
    }
  }
  static async getExpensesTransactions({ payload, userId, i18n }, callback) {
    try {
      console.log(
        "Fetching expenses transactions with payload:",
        payload,
        "for user ID:",
        userId
      );
      const page = parseInt(payload?.page) || 1;
      const limit = parseInt(payload?.limit) || 10;
      const offset = (page - 1) * limit;
      const categoryId = payload?.categoryId || null;
      const month = payload?.month || null;
      const year = payload?.year || null;

      const whereClause = {
        userId: userId,
        transaction_status: "Success",
      };
      if (categoryId) {
        whereClause.expenseCatId = categoryId;
      }
      if (month) {
        whereClause.created_month = month;
      }
      if (year) {
        whereClause.created_year = year;
      }

      const response = await PisoPayTransactionInfos.findAndCountAll({
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: limit,
        where: whereClause,
        include: [
          {
            model: ExpensesCategories,
            as: "expenseCategory",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
        ],
      });
      return callback(null, { data: response });
    } catch (e) {
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      console.log("Error in getExpensesTransactions:", e.message);
      callback(new Error("FAILED_TO_FETCH_EXPENSES_TRANSACTIONS"), null);
    }
  }
  //get expenses report
  static async getExpensesReport({ payload, userId, i18n }, callback) {
    try {
      console.log(
        "Generating expenses report with payload:",
        payload,
        "for user ID:",
        userId
      );
      const month = payload?.month;
      const year = payload?.year;

      const whereClause = {
        userId: userId,
        transaction_status: "Success",
      };
      // Add month/year filters only if provided
      if (month) {
        whereClause.created_month = month;
      }
      if (year) {
        whereClause.created_year = year;
      }

      const results = await PisoPayTransactionInfos.findAll({
        attributes: ["expenseCatId", [fn("SUM", col("amount")), "totalAmount"]],
        where: whereClause,
        group: ["expenseCatId"],
        raw: false,
      });
      // const results = resultsRaw ? resultsRaw.map(r => r.get({ plain: true })) : [];
      //get expenses categories
      const getExpenseCategories = await ExpensesCategories.findAll({
        attributes: { exclude: ["createdAt", "updatedAt"] },
      });
      let totalExpenseAmt = 0; // total expense amount
      let reportArray = []; //report array to hold final report
      if (results.length > 0) {
        const totalamt = results.reduce((sum, record) => {
          return sum + parseFloat(record.getDataValue("totalAmount") || 0);
        }, 0);
        totalExpenseAmt = parseFloat(totalamt.toFixed(2));
      }

      for (const cat of getExpenseCategories) {
        const found = results.find(
          (r) => parseInt(r.getDataValue("expenseCatId")) === parseInt(cat.id)
        );
        reportArray.push({
          catDetails: cat,
          totalAmount: found
            ? parseFloat(found.getDataValue("totalAmount") || 0)
            : 0,
          percentage:
            totalExpenseAmt > 0
              ? parseFloat(
                  (
                    ((found
                      ? parseFloat(found.getDataValue("totalAmount") || 0)
                      : 0) /
                      totalExpenseAmt) *
                    100
                  ).toFixed(2)
                )
              : 0,
        });
      }
      // console.log("Expenses report results:", results);
      return callback(null, {
        data: {
          currency: paymentCurrencies["PHP"],
          totalExpenseAmt,
          reportArray,
        },
      });
    } catch (e) {
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      console.log("Error in getExpensesReport:", e.message);
      callback(new Error("FAILED_TO_FETCH_EXPENSES_REPORT"), null);
    }
  }
}
