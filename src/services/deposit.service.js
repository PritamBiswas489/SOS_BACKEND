import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
const { UserCard, Op, User } = db;

export default class DepositService {
  static async SaveCardDetails(data) {
    try {
      // Unset default for all user's cards in a single query
      await UserCard.update(
        { isDefault: false },
        { where: { userId: data.userId } }
      );

      // Ensure isDefault is true for the new card
      const cardData = { ...data, isDefault: true };
      const createdCard = await UserCard.create(cardData);

      return createdCard;
    } catch (e) {
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      return { error: e.message };
    }
  }
  static async markCardAsDefault(userId, cardId) {
    try {
      await UserCard.update({ isDefault: false }, { where: { userId } });
      const d = await UserCard.update(
        { isDefault: true },
        { where: { id: cardId } }
      );
      return d;
    } catch (e) {
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      return { error: e.message };
    }
  }
}
