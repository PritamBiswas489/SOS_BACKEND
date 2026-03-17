import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import ExpensesCategoriesService from "../services/expenses.categories.service.js";


export default class ExpensesCategoriesController {
     static async listExpenses(req, res) {
        try {
            const expensesCategories = await ExpensesCategoriesService.getAllExpenses();
            return { status: 200, data: expensesCategories, message: "",  error: {}, };
        } catch (e) {
            if (process.env.SENTRY_ENABLED === "true") {
                Sentry.captureException(e);
            }
            return { status: 500, error: e.message , data:{}, message: "" };
        }

    }

}