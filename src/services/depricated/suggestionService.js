import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { SuggestionType, SuggestionPriorityLevel, Suggestions, Op, User } = db;

export default class SuggestionService {
  static async addSuggestionType(suggestionTypes) {
    try {
      const createdSuggestionTypes =
        await SuggestionType.bulkCreate(suggestionTypes);
      return createdSuggestionTypes;
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw new Error("Error adding suggestion types");
    }
  }
  static async getSuggestionTypes() {
    try {
      const suggestionTypes = await SuggestionType.findAll();
      return { data: suggestionTypes };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }

  static async clearSuggestionTypeTable() {
    try {
      await SuggestionType.destroy({ where: {}, truncate: true });
      return { message: "All suggestion types cleared successfully." };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { error: error.message };
    }
  }

  static async addSuggestionPriorityLevels(priorityLevels) {
    try {
      const createdPriorityLevels =
        await SuggestionPriorityLevel.bulkCreate(priorityLevels);
      return createdPriorityLevels;
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw new Error("Error adding suggestion priority levels");
    }
  }
  static async getSuggestionPriorityLevels() {
    try {
      const priorityLevels = await SuggestionPriorityLevel.findAll();
      return { data: priorityLevels };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }

  static async clearSuggestionPriorityLevelTable() {
    try {
      await SuggestionPriorityLevel.destroy({ where: {}, truncate: true });
      return {
        message: "All suggestion priority levels cleared successfully.",
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { error: error.message };
    }
  }
  static async submitSuggestion(payload, userId) {
    console.log("Submitting suggestion with payload:", payload);
    try {
      const suggestionPayload = {
        ...payload,
        userId: userId,
      };
      const suggestion = await Suggestions.create(suggestionPayload);
      return { data: suggestion };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }
  static async getMySuggestions(userId, payload) {
    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const suggestions = await Suggestions.findAll({
        where: {
          userId: userId,
        },
        include: [
          { model: SuggestionType, as: "type" },
          { model: SuggestionPriorityLevel, as: "priorityLevel" },
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return { data: suggestions };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }
  static async getAllSuggestions(payload) {

    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const suggestions = await Suggestions.findAll({
        include: [
          { model: User, as: "user" , attributes: ["id", "name", "email", "phoneNumber"], },
          { model: SuggestionType, as: "type" },
          { model: SuggestionPriorityLevel, as: "priorityLevel" },
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return { data: suggestions };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { ERROR: true, message: error.message };
    }
  }
}
