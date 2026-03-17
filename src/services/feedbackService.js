import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { FeedbackCategory, Feedbacks, Op, User } = db;

export default class FeedbackService {
  static async addCategories(categories) {
    try {
      const createdCategories = await FeedbackCategory.bulkCreate(categories);
      return createdCategories;
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw new Error("Error adding categories");
    }
  }
  static async getFeedbackCategory() {
    try {
      const categories = await FeedbackCategory.findAll();
      return { data: categories };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }
  // Clear all entries in FeedbackCategory table
  static async clearFeedbackCategoryTable() {
    try {
      await FeedbackCategory.destroy({ where: {}, truncate: true });
      return { message: "All feedback categories cleared successfully." };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { error: error.message };
    }
  }
  //submit feedback
  static async submitFeedback(payload) {
    try {
      console.log("Feedbacks model:", Feedbacks);
      const feedback = await Feedbacks.create(payload);
      return { data: feedback };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }

  static async getMyFeedbacks(userId, payload) {
    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;

      const feedbacks = await Feedbacks.findAll({
        where: {
          userId: userId,
        },
        include: [
          {
            model: FeedbackCategory,
            as: "category",
          },
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return { data: feedbacks };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }

  static async getAllFeedbacks(payload) {
    console.log("payload -", payload);
    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const feedbacks = await Feedbacks.findAll({
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phoneNumber"],
          },
          {
            model: FeedbackCategory,
            as: "category",
          },
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return { data: feedbacks };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }
}
