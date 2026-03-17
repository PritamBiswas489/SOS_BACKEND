import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import BankTransferTransactionsService from "../services/bankTransferTransactions.service.js";

export default class BankTransferPaymentController {
  static async initiateBankTransferPayment(request) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const privateKeyPath = path.join(
      __dirname,
      "../../public/freezBackKeys/privateprod.key",
    );
    //check file exists
    if (!fs.existsSync(privateKeyPath)) {
      return {
        status: 500,
        message: "Private key file does not exist",
        error: { message: "Private key file does not exist" },
      };
    }

    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    console.log("Private key loaded successfully.");
    console.log("Private Key Content:", privateKey);

    const payload = {
      sub: "6666",
      iss: "tpp/HEoRGloC4D",
      srv: "fast/user",
      flow: {
        id: "default",
        payment: {
          remittanceInformationUnstructured: "R89001",
          creditor: {
            name: "העברה בגין הזמנה R12345",
            account: "IL820126560000000688807",
            accountType: "iban",
          },
          transfer: {
            amount: {
              value: "1.00",
              editable: true,
            },
            currency: {
              value: "ILS",
              editable: true,
            },
          },
        },
        userWasAuthenticated: false,
        context: "R89001",
        redirects: {
          ttlExpired: `${process.env.BASE_URL}/api/front/bank-transfer-payment-webhook`,
          pisSuccess: `${process.env.BASE_URL}/api/front/bank-transfer-payment-webhook`,
          pisFailure: `${process.env.BASE_URL}/api/front/bank-transfer-payment-webhook`,
          pisNotComplete: `${process.env.BASE_URL}/api/front/bank-transfer-payment-webhook`,
        },
      },
      // Uncomment to enable mock: enableMock: true
    };
    const token = jwt.sign(payload, privateKey, { algorithm: "RS512" });

    console.log("JWT Token generated successfully.", token);

    const postData = {
      token: token,
    };

    console.log("postData", postData);

    try {
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

      const result = response.data;
      const paymentLink = result.link;

      console.log("Payment link:", paymentLink);
      // Redirect user to paymentLink for payment
      return {
        status: 200,
        message: "Bank transfer payment initiated successfully",
        data: { paymentLink, result },
        error: {},
      };
    } catch (error) {
      return {
        status: 500,
        message: "Error initiating bank transfer payment",
        error: { message: error.message },
      };
    }
  }

  static async getPaymentLink(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;
    const userId = user?.id || 1;

    return new Promise((resolve) => {
      BankTransferTransactionsService.getPaymentLinkByUserId(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(err.message || "FAILED_TO_GET_PAYMENT_LINK"),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("GET_PAYMENT_LINK_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async handleBankTransferPaymentWebhook(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    console.log("Received webhook payload:", payload);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePathToSavePayload = path.join(
      __dirname,
      `../../public/freezBackKeys/webhooks/${`bank_transfer_webhook_payload_${Date.now()}.json`}`,
    );
    fs.writeFileSync(filePathToSavePayload, JSON.stringify(payload));
    console.log("Webhook payload saved to:", filePathToSavePayload);
    // BankTransferTransactionsService.saveWebhookData(payload);
  }
}
