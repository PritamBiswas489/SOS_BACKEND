import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import AirwallexPaymentService from "../services/airwallexPayment.service.js";

export default class AirwallexPaymentController {
  static async createMerchantOrderIdRequestId(request) {
    const {
      payload,
      headers: { i18n, deviceLocation },
      user,
    } = request;

    const userId = user?.id || 1;

    const deviceLocationLatLng = deviceLocation || "";
    if (deviceLocationLatLng) {
      const [latitude, longitude] = deviceLocationLatLng.split(",");
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    return new Promise((resolve) => {
      AirwallexPaymentService.createMerchantOrderIdRequestId(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message ||
                    "FAILED_TO_CREATE_MERCHANT_ORDER_ID_REQUEST_ID",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__(
              "MERCHANT_ORDER_ID_REQUEST_ID_CREATED_SUCCESSFULLY",
            ),
            error: null,
          });
        },
      );
    });
  }

  static async airWallexCreateCustomerAccount(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const userId = user?.id || 1;

    return new Promise((resolve) => {
      AirwallexPaymentService.airWallexCreateCustomerAccount(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "FAILED_TO_CREATE_CUSTOMER_ACCOUNT",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("CUSTOMER_ACCOUNT_CREATED_SUCCESSFULLY"),
            error: null,
          });
        },
      );
    });
  }

  static async airWallexAuthorizeAccount(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;


    const userId = user?.id || 1;

    return new Promise((resolve) => {
      AirwallexPaymentService.airWallexAuthorizeAccount(
        { payload, userId, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "FAILED_TO_AUTHORIZE_CUSTOMER_ACCOUNT",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("CUSTOMER_ACCOUNT_AUTHORIZED_SUCCESSFULLY"),
            error: null,
          });
        },
      );
    });
  }

  static async handlePaymentWebhook(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    console.log("Received webhook payload:", payload);

    await AirwallexPaymentService.handlePaymentWebhook({ payload });
    return {
      status: 200,
      message: "Webhook received",
      data: {},
      error: {},
    };
  }
}
