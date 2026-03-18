import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const { Op, User, BankTransferTransactions } = db;

export default class BankTransferTransactionsService {
  static async getPaymentLinkByUserId(args,callback) {
    try {
      const { payload, userId, i18n } = args ;
      const amount = parseFloat(payload?.amount);
      if(!amount || isNaN(amount) || amount <= 0){
        return callback(new Error("INVALID_AMOUNT"));
      }
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const privateKeyPath = path.join(
        __dirname,
        "../../public/freezBackKeys/privateprod.key",
      );
      //check file exists
      if (!fs.existsSync(privateKeyPath)) {
          return callback(new Error("PRIVATE_KEY_NOT_FOUND"));
      }

      const privateKey = fs.readFileSync(privateKeyPath, "utf8");
      const paymentId = uuidv4();

      const payloadPayment = {
        sub: paymentId,
        iss: "tpp/HEoRGloC4D",
        srv: "fast/user",
        flow: {
          id: "default",
          payment: {
            remittanceInformationUnstructured:  'topupWallet',
            creditor: {
              name: "העברה בגין הזמנה R12345",
              account: "IL820126560000000688807",
              accountType: "iban",
            },
            transfer: {
              amount: {
                value: amount.toFixed(2),
                editable: false,
              },
              currency: {
                value: "ILS",
                editable: false,
              },
            },
          },
          userWasAuthenticated: false,
          context: paymentId,
        //   redirects: {
        //     ttlExpired: `${process.env.BASE_URL}/api/front/bank-transfer-payment-webhook`,
        //     pisSuccess: `${process.env.BASE_URL}/api/front/bank-transfer-payment-webhook`,
        //     pisFailure: `${process.env.BASE_URL}/api/front/bank-transfer-payment-webhook`,
        //     pisNotComplete: `${process.env.BASE_URL}/api/front/bank-transfer-payment-webhook`,
        //   },
          enableMock: true,
        },
        // Uncomment to enable mock: enableMock: true
      };

    //   console.log("Payload for Payment Link:", JSON.stringify(payloadPayment));
    //   return;
     
      const token = jwt.sign(payloadPayment, privateKey, { algorithm: "RS512" });
      const postData = {
        token: token,
      };

      const response = await axios.post(
        "https://lgs-prod.feezback.cloud/link",
        postData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          maxRedirects: 10,
          timeout: 0,
        },
      );

      const result = response?.data;
      const paymentLink = result?.link;
      if(!paymentLink){
        return callback(new Error("FAILED_TO_GET_PAYMENT_LINK"));
      }
        //store in bankTransferTransactions table
        const newTransaction = await BankTransferTransactions.create({
          uuid: paymentId,
          userId: userId,
          postData: postData,
          paymentLink: paymentLink,
          status: "pending",
        });
        return callback(null, {
          status: 200,
          data: { paymentLink , newTransaction },
        });
    } catch (error) {
        console.log("Error in getPaymentLinkByUserId:", error?.message);
        process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
        return callback(new Error("FAILED_TO_GET_PAYMENT_LINK"));

    }
  }
}
