import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { WalletPelePayment, Op, User } = db;

export default class PaymentService {
    static async savePelePaymentDetails(data) {
        try {
            const createdPayment = await WalletPelePayment.create(data);
            return createdPayment;
        } catch (e) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            return { ERROR: e.message };
        }
    }
}