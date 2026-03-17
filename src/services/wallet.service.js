import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import { getPeleCardCurrencyNumber, amountUptotwoDecimalPlaces } from "../libraries/utility.js";
import CurrencyService from "./currency.service.js";
import SettingsService from "./settings.service.js";
import { where } from "sequelize";
import { walletCurrencies } from "../config/walletCurrencies.js";

const { WalletPelePayment, WalletAirwallexPayments, Op, User, UserWallet, WalletTransaction, Transfer, TransferRequests, PisoPayTransactionInfos , NinePayTransactionInfos, kessPayTransactionInfos, ExpensesCategories} = db;

export default class WalletService {
  static async updateUserWalletBalanceAfterPayment(
    paymentData,
    paidCurrency,
    walletAmount
  ) {
    // console.log("user id ", paymentData.userId);
    try {
        let oldWalletBalance = 0;
        let newWalletBalance = 0;

        const existingWallet = await UserWallet.findOne({
          where: { userId: paymentData.userId, currency: paidCurrency },
        });
        if (existingWallet) {
          oldWalletBalance = parseFloat(existingWallet.balance);
        }
         if (paymentData.StatusCode === "000") {
           if (existingWallet) {
                const updatedBalance =
                parseFloat(existingWallet.balance) + walletAmount;
                await UserWallet.update(
                  { balance: updatedBalance },
                  { where: { id: existingWallet.id } }
                );
           }else{
              await UserWallet.create({
                  userId: paymentData.userId,
                  balance: walletAmount,
                  currency: paidCurrency,
              });
           }
         }
         const userWallet = await UserWallet.findOne({
            where: {
              userId: paymentData.userId,
              currency: paidCurrency,
            },
         });
         newWalletBalance = parseFloat(userWallet?.balance || 0);

          const walletTransactionDetails = await WalletTransaction.create({
              userId: paymentData.userId,
              walletId: userWallet?.id || 0,
              paymentAmt: walletAmount,
              paymentCurrency: paidCurrency,
              oldWalletBalance: oldWalletBalance,
              newWalletBalance: newWalletBalance,
              type: "credit",
              description: `Add ${walletAmount} ${paidCurrency}. ${paymentData.StatusCode === "000" ? "completed" : "failed"} payment`,
              description_he: `הוספת ${walletAmount} ${paidCurrency}. תשלום ${paymentData.StatusCode === "000" ? "הושלם" : "נכשל"}`,
              status: paymentData.StatusCode === "000" ? "completed" : "failed",
              paymentId: paymentData?.id,
        });
        return { userWallet,  walletTransactionDetails };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: e.message };
    }
  }
  static async updateWalletAfterSuccessAirwallexPayment(
    airwallexPaymentData){
      try{
        const amount = parseFloat(airwallexPaymentData?.amount);
        const currency = airwallexPaymentData?.currency || "ILS";
        const userId = airwallexPaymentData?.userId;
        let oldWalletBalance = 0;
        let newWalletBalance = 0;

        const existingWallet = await UserWallet.findOne({
          where: { userId: userId, currency: currency },
        });
        if (existingWallet) {
          oldWalletBalance = parseFloat(existingWallet.balance);
        }

        if (existingWallet) {
              const updatedBalance =
              parseFloat(existingWallet.balance) + amount;
              await UserWallet.update(
                { balance: updatedBalance },
                { where: { id: existingWallet.id } }
              );
         }else{
            await UserWallet.create({
                userId: userId,
                balance: amount,
                currency: currency,
            });
         }

          const userWallet = await UserWallet.findOne({
            where: {
              userId: userId,
              currency: currency,
            },
         });
         newWalletBalance = parseFloat(userWallet?.balance || 0);

          const walletTransactionDetails = await WalletTransaction.create({
              userId: userId,
              walletId: userWallet?.id || 0,
              paymentAmt: amount,
              paymentCurrency:  currency,
              oldWalletBalance: oldWalletBalance,
              newWalletBalance: newWalletBalance,
              type: "credit",
              description: `Add ${amount} ${currency}. ${airwallexPaymentData.status === "SUCCEEDED" ? "completed" : "failed"} payment`,
              description_he: `הוספת ${amount} ${currency}. תשלום ${airwallexPaymentData.status === "SUCCEEDED" ? "הושלם" : "נכשל"}`,
              status: airwallexPaymentData.status === "SUCCEEDED" ? "completed" : "failed",
              airwallexPaymentId: airwallexPaymentData?.id,
        });
        return { userWallet,  walletTransactionDetails };
          

      } catch(e){
        process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
        return { ERROR: e.message };
      }

    } 

  static async getUserWallet(userId, currency = []) {
    try {
      const userWallet = await UserWallet.findAndCountAll({
        where: {
          userId: userId,
          ...(currency.length > 0 && { currency: { [Op.in]: currency } }),
        },
      });
      return userWallet;
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: e.message };
    }
  }
  static async getUserWalletAllCurrencies(userId) {
    try{
      const walletCurrenciesList = Object.keys(walletCurrencies);
      let userWallets = [];
      for (const currency of walletCurrenciesList) {
        const existingWallet = await UserWallet.findOne({
          where: { userId: userId, currency: currency },
        });
        userWallets.push({ currency, balance: existingWallet ? existingWallet.balance : 0 });
      }
      return userWallets;
    }catch(e){
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: e.message };
    }
  }
  static async getUserWalletTransactionHistory(userId, {  filter, transferStatus, transferRequestStatus, page = 1, limit = 10 }) {
    try {
      const offset = (page - 1) * limit;

      // console.log("filter", filter, userId);

      let whereClause = {
        userId: userId,
        status: "completed"
      };
      let transferWhere = {};
      let transferRequestWhere = {};

     if (
        filter &&
        ["sent", "received", "topup", "expenses"].includes(filter)
      ) {
        if (filter === "sent") {
          whereClause[Op.or] = [
            { transferId: { [Op.ne]: null } },
            { transferRequestId: { [Op.ne]: null } },
            { pisoPayTransactionId: { [Op.ne]: null } },
            { ninePayTransactionId: { [Op.ne]: null } },
            { kesspayTransactionId: { [Op.ne]: null } },
          ];
         transferWhere = { senderId: userId }; 
         transferRequestWhere = { receiverId : userId };
        } else if (filter === "received") {
          whereClause[Op.or] = [
            { transferId: { [Op.ne]: null } },
            { transferRequestId: { [Op.ne]: null } },
          ];
          transferWhere = { receiverId: userId };
          transferRequestWhere = { senderId: userId };
        } else if (filter === "topup") {
           whereClause[Op.or] = [
            { paymentId: { [Op.ne]: null } },
            { airwallexPaymentId: { [Op.ne]: null } },

           ]

         
           
          
        } else if (filter === "expenses") {
          console.log("expenses filter");
            whereClause[Op.or] = [
            { pisoPayTransactionId: { [Op.ne]: null } },
            { ninePayTransactionId: { [Op.ne]: null } },
            { kesspayTransactionId: { [Op.ne]: null } },
            ];
        }
      }

      const userWalletTransactions = await WalletTransaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: WalletPelePayment,
            as: "walletPayment",
            attributes: [
              "id",
              "PelecardTransactionId",
              "VoucherId",
              "CreditCardNumber",
              "Token",
              "CreditCardNumber",
              "CreditCardExpDate",
              "DebitApproveNumber",
              "CardHebName",
              "TotalPayments",
              "latitude",
              "longitude",
              [
                db.Sequelize.literal(
                  'CAST("walletPayment"."interestRate" AS FLOAT)'
                ),
                "interestRate",
              ],
              [
                db.Sequelize.literal(
                  'CAST("walletPayment"."DebitTotal" AS FLOAT) / 100.0'
                ),
                "DebitTotal",
              ],
              [
                db.Sequelize.literal(
                  'CAST("walletPayment"."FirstPaymentTotal" AS FLOAT) / 100.0'
                ),
                "FirstPaymentTotal",
              ],
            ],
          },
          {
            model: WalletAirwallexPayments,
            as: "walletAirwallexPayment",
            attributes:[
              "id",
              "uuid",
              "merchantOrderId",
              "amount",
              "currency",
              "capturedAmount",
              "status",
              "latitude",
              "longitude"
              
            ]
          },
          {
            model: Transfer,
            as: "transfer",
            where: transferWhere,
            required: false,
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["name", "phoneNumber"],
              },
              {
                model: User,
                as: "receiver",
                attributes: ["name", "phoneNumber"],
              },
            ],
          },
          {
            model: TransferRequests,
            as: "transferRequest",
            where: transferRequestWhere,
            required: false,
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["name", "phoneNumber"],
              },
              {
                model: User,
                as: "receiver",
                attributes: ["name", "phoneNumber"],
              },
            ],
          },
          {
            model: PisoPayTransactionInfos,
            as: "pisopayTransaction",
            required: false,
             include: [
              {
                model: ExpensesCategories,
                as: "expenseCategory",
                attributes: { exclude: ["createdAt", "updatedAt"] },
              },
            ],
          },
          {
            model: NinePayTransactionInfos,
            as: "ninePayTransaction",
            required: false,
            include: [
              {
                model: ExpensesCategories,
                as: "expenseCategory",
                attributes: { exclude: ["createdAt", "updatedAt"] },
              },
            ],
          },
          {
            model: kessPayTransactionInfos,
            as: "kesspayTransaction",
            required: false,
            include: [
              {
                model: ExpensesCategories,
                as: "expenseCategory",
                attributes: { exclude: ["createdAt", "updatedAt"] },
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: limit,
      });

      // Remove transactions where all 3 relations are null
      const filteredRows = userWalletTransactions.rows.filter(tx => 
      tx.walletPayment !== null ||
      tx.walletAirwallexPayment !== null ||
      tx.transfer !== null ||
      tx.transferRequest !== null ||
      tx.pisopayTransaction !== null ||
      tx.ninePayTransaction !== null ||
      tx.kesspayTransaction !== null
      );
      return { ...userWalletTransactions, rows: filteredRows };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return { ERROR: e.message };
    }
  }
}
