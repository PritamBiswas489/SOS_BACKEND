import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { Faq, Op, User } = db;
export default class FaqService {
    
    static async addFaq(question, answer, order) {
        try {
            const faq = await Faq.create({ question, answer, order });
            return { data: faq };
        } catch (error) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            return { ERROR: true, message: error.message };
        }
    }
    static async listFaqs() {
        try {
            const faqs = await Faq.findAll({
                order: [["order", "ASC"]],
            });
            return { data: faqs };
        } catch (error) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            return { ERROR: true, message: error.message };
        }

    }

}