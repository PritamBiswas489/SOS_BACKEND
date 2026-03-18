import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { ExpensesCategories } = db;

export default class ExpensesCategoriesService {
  static async createExpense(data) {
    try {
        const createdExpense = await ExpensesCategories.create(data);
        return createdExpense;
    } catch (e) {
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      return { error: e.message };
    }
  }
  static async clearExpenseTable() {
    try {
      await ExpensesCategories.destroy({ where: {}, truncate: true });
      return { message: "All expenses cleared successfully." };
    } catch (e) {
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      return { error: e.message };
    }
  }
  static async getAllExpenses() {
    try {
      const expenses = await ExpensesCategories.findAll();
      return expenses;
    } catch (e) {
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      return { error: e.message };
    }
  }
}
