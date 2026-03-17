import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import axios from "axios";
import { walletCurrencies } from "../config/walletCurrencies.js";
import { paymentCurrencies } from "../config/paymentCurrencies.js";
import NinePayApiService from "./ninePayApi.service.js";
import UserService from "./user.service.js";
import CurrencyService from "./currency.service.js";

const {
  NinePayTransactionInfos,
  ExpensesCategories,
  UserWallet,
  WalletTransaction,
  PisopyPaymentErrorLogs,
  Op,
  fn,
  col
} = db;


export default class VietnamPaymentService {
  // static method
  static async decodeQrCode({ qrCode }, callback) {
    try {
      const decodedData = await NinePayApiService.decodeQrCode(qrCode);
      console.log("Decoded QR Code Data:", decodedData);
      if (decodedData?.ERROR) {
        throw new Error("QR_CODE_DECODE_FAILED");
      }
      return callback(null, {
        data: { qrCode, decoded: true, data: decodedData },
      });
    } catch (e) {
      console.error("Error in decodeQrCode:", e.message);
      return callback(e, null);
    }
  }
  static async trackTransaction(paymentData, transaction) {
    try {
      const createdRecord = await NinePayTransactionInfos.create(
        {
          request_id: paymentData.request_id,
          partner_id: paymentData.partner_id,
          transaction_id: paymentData.transaction_id,
          bank_no: paymentData.bank_no,
          account_no: paymentData.account_no,
          account_type: paymentData.account_type,
          account_name: paymentData.account_name,
          request_amount: paymentData.request_amount,
          transfer_amount: paymentData.transfer_amount,
          status: paymentData.status || "PENDING",
          date_time: paymentData.date_time || new Date(),
          fee: paymentData.fee,
          content: paymentData.content,
          extra_data: paymentData.extra_data,
          callBack_data: paymentData.callBack_data,
          approved_at: paymentData.approved_at,
          userId: paymentData.userId,
          expenseCatId: paymentData.expenseCatId,
          memo: paymentData.memo,
          walletCurrency: paymentData.walletCurrency,
          amountInUserWalletCurrency: paymentData.amountInUserWalletCurrency,
          latitude: paymentData.latitude,
          longitude: paymentData.longitude,
          is_valid_transfer_signature: paymentData.is_valid_transfer_signature,
          qr_code: paymentData.qrCode,
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
  //buy expense
  static async buyExpense({ userId, payload, i18n }, callback) {
    const tran = await db.sequelize.transaction();
    try {
      const walletCurrency = payload?.walletCurrency;
      const amount = parseFloat(payload?.amount || 0);
      const expenseCatId = payload?.expenseCatId || 1;
      const memo = payload?.memo || "Expense payment";
      const qrCode = payload?.qrCode || "";
      const bank_no = payload?.bank_no || "";
      const account_number = payload?.account_number || "";
      const account_name = payload?.account_name || "";
      const latitude = payload?.latitude || "";
      const longitude = payload?.longitude || "";
      const is_fixed_price = payload?.is_fixed_price;
      const expenseDet = await ExpensesCategories.findOne({
        where: { id: expenseCatId },
      });
      if (!expenseDet) {
        await tran.rollback();
        return callback(new Error("EXPENSE_CATEGORY_NOT_FOUND"), null);
      }
      const expenseCatName = expenseDet ? expenseDet.title : "General Expense";

      console.log("Payload:", {
        walletCurrency,
        amount,
        expenseCatId,
        memo,
        bank_no,
        account_number,
        account_name,
        latitude,
        longitude,
        qrCode,
      });

      if (walletCurrencies[walletCurrency] === undefined) {
        await tran.rollback();
        return callback(new Error("INVALID_WALLET_CURRENCY"), null);
      }
      if (!amount || amount <= 0) {
        await tran.rollback();
        return callback(new Error("INVALID_AMOUNT"), null);
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
            "VND",
            walletCurrency,
            amount,
            (err, res) => {
              if (err) {
                console.error("Currency conversion error:", err);
                process.env.SENTRY_ENABLED === "true" &&
                  Sentry.captureException(
                    new Error(
                      "Currency converstion failed during buy expense in NinePay: " +
                        JSON.stringify(err)
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

      const oldWalletBalance = userWalletBalance;
      const newWalletBalance = parseFloat(
        (userWalletBalance - actualPaymentAmountToSelectedCurrency).toFixed(6)
      );
      userWallet.balance = newWalletBalance;
      await userWallet.save({ transaction: tran });

      const serviceTransfer = await NinePayApiService.serviceTransfer(payload);
      console.log("Service Transfer Response:", serviceTransfer);
      if (serviceTransfer?.ERROR) {
        throw new Error("QR_CODE_PAYMENT_FAILED");
      }
      // //insert into ninepay_transactions table
      const dt = serviceTransfer.data;
      Object.assign(dt, {
        userId,
        expenseCatId,
        memo,
        qrCode,
        is_fixed_price,
        amountInUserWalletCurrency: actualPaymentAmountToSelectedCurrency,
        walletCurrency,
        latitude: payload?.latitude ?? null,
        longitude: payload?.longitude ?? null,
        account_type:
          parseInt(dt?.account_type) === 0 ? "TRANSFER_BANK" : "BANK_CARD",
      });
      console.log("Data to insert into ninepay_transaction_infos:", dt);
      const trackedTransaction = await this.trackTransaction(dt, tran);
      const ninePayTransactionId = trackedTransaction.id;
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
          ninePayTransactionId: ninePayTransactionId,
          description: i18n.__(
            { phrase: "EXPENSE_PAYMENT_TRANSACTION_SUCCESSFUL", locale: "en" },
            {
              amount: actualPaymentAmountToSelectedCurrency,
              currency: walletCurrency,
              merchantName: account_name,
              merchantCity: bank_no,
              expenseCatName,
            }
          ),
          description_he: i18n.__(
            { phrase: "EXPENSE_PAYMENT_TRANSACTION_SUCCESSFUL", locale: "he" },
            {
              amount: actualPaymentAmountToSelectedCurrency,
              currency: walletCurrency,
              merchantName: account_name,
              merchantCity: bank_no,
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
    } catch (e) {
      if (tran?.finished !== "commit") {
        await tran.rollback();
      }
      console.error("Error in buyExpense:", e.message);
      return callback(e, null);
    }
  }
  static async updateTransactionStatus(payload, i18n) {
    const { request_id, status } = payload;
    const record = await NinePayTransactionInfos.findOne({
      where: {
        request_id: request_id,
        status: { [Op.notIn]: ["FAIL", "SUCCESS"] },
      },
    });
    try {
      if (record) {
        const isValidSignature =
          await NinePayApiService.validateCallbackSignature(payload);
        console.log("Is valid callback signature:", isValidSignature);
        record.is_valid_callback_signature = isValidSignature;
        record.status = status;
        record.callBack_data = payload;
        await record.save();
      }
      if (["FAIL"].includes(status)) {
        console.log(
          `Handling ${status.toLowerCase()} transaction for:`,
          request_id
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
              ninePayTransactionId: record.id,
              description: i18n.__(
                { phrase: "EXPENSE_PAYMENT_TRANSACTION_FAILED2", locale: "en" },
                {
                  amount: amountInUserWalletCurrency,
                  currency: record.walletCurrency,
                  merchantName: record.account_name,
                  merchantCity: record.bank_no,
                  expenseCatName,
                }
              ),
              description_he: i18n.__(
                { phrase: "EXPENSE_PAYMENT_TRANSACTION_FAILED2", locale: "he" },
                {
                  amount: amountInUserWalletCurrency,
                  currency: record.walletCurrency,
                  merchantName: record.account_name,
                  merchantCity: record.bank_no,
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
            request_id
          );
        } catch (e) {
          if (tran?.finished !== "commit") await tran.rollback();
          const ERROR_MSG = `Failed to refund wallet for transaction ${request_id}: ${e.message}`;
          throw new Error(ERROR_MSG);
        }
      }
      console.log("Transaction status updated for:", request_id);
    } catch (e) {
      const ERROR_MSG = `Failed in ninePay callback. ${request_id}: ${e.message}`;
      console.log(ERROR_MSG);
    }
  }
  static async getExpenseTransactionDetails(
    { request_id, userId, i18n },
    callback
  ) {
    try {
      const response = await NinePayTransactionInfos.findOne({
        where: { request_id: request_id, userId },
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
          status: "SUCCESS",
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
  
        const response = await NinePayTransactionInfos.findAndCountAll({
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
        status: "SUCCESS",
      };
      // Add month/year filters only if provided
      if (month) {
        whereClause.created_month = month;
      }
      if (year) {
        whereClause.created_year = year;
      }

      const results = await  NinePayTransactionInfos.findAll({
        attributes: ["expenseCatId", [fn("SUM", col("request_amount")), "totalAmount"]],
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
          currency: paymentCurrencies["VND"],
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

    
 
 
