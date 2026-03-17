import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import UserService from "./user.service.js";
const { Op, User, TransferRequests, WalletTransaction, UserWallet } = db;
import { handleCallback } from "../libraries/utility.js";
import NotificationService from "./notification.service.js";
import moment from "moment";

export default class TransferRequestService {
  static async executeTransferRequest(
    { senderUserId, receiverId, currency, amount, message, i18n, deviceLocation },
    callback
  ) {
    const tran = await db.sequelize.transaction();
    try {
      const senderUserDetails = await UserService.getUserDetails(senderUserId);
      const receiverUserDetails = await UserService.getUserDetails(receiverId);

      if (senderUserId === receiverId) {
        await tran.rollback();
        return handleCallback(
          new Error("CANT_SEND_REQUEST_TO_SELF"),
          null,
          callback
        );
      }

      if (!receiverUserDetails) {
        await tran.rollback();
        return handleCallback(
          new Error("NO_USER_FOUND_SELECTED_MOBILE_NUMBER"),
          null,
          callback
        );
      }

      if (receiverUserDetails?.kyc?.status !== "Approved") {
        await tran.rollback();
        return handleCallback(
          new Error("CANT_SEND_REQUEST_BECAUSE_OF_UNAPPROVED_KYC"),
          null,
          callback
        );
      }

      // 🔒 Lock any existing pending request between sender and receiver
      const pendingTransferRequest = await TransferRequests.findOne({
        where: {
          senderId: senderUserId,
          receiverId: receiverId,
          status: "pending",
        },
        lock: tran.LOCK.UPDATE, // ✅ lock this row
        skipLocked: true, // ✅ avoids deadlocks if another tx is processing
        transaction: tran,
      });

      if (pendingTransferRequest) {
        await tran.rollback();
        return handleCallback(
          new Error("PENDING_TRANSFER_REQUEST_EXISTS"),
          null,
          callback
        );
      }

      const createData = {
          senderId: senderUserId,
          receiverId: receiverId,
          currency: currency,
          amount: amount,
          message: message || null,
          status: "pending",
        };
      const deviceLocationLatLng = deviceLocation || "";
      if (deviceLocationLatLng) {
        const [latitude, longitude] = deviceLocationLatLng.split(",");
        createData.senderLatitude = parseFloat(latitude);
        createData.senderLongitude = parseFloat(longitude);
      }

      const createTransferRequest = await TransferRequests.create(
        createData,
        { transaction: tran }
      );
       const createAtTimeMoment = moment.parseZone(createTransferRequest.createdAt);
       const expiredTime = createAtTimeMoment.add(24, "hours");
       createTransferRequest.expireAt = expiredTime.format("YYYY-MM-DD HH:mm:ss.SSSZ");
       await createTransferRequest.save({ transaction: tran });

      await tran.commit();

      NotificationService.transferRequestNotification(
        createTransferRequest.id,
        i18n,
        message
      );

      return handleCallback(
        null,
        { data: { request: createTransferRequest } },
        callback
      );
    } catch (error) {
      if (tran?.finished !== "commit") {
        await tran.rollback();
      }
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return handleCallback(
        new Error("TRANSFER_REQUEST_FAILED"),
        null,
        callback
      );
    }
  }

static async acceptRejectTransferRequest(
  { transferRequestId, userId, status, i18n, autoRejected, deviceLocation },
  callback
) {
  console.log(
    "Accept/Reject Transfer Request",
    transferRequestId,
    userId,
    status
  );
  const tran = await db.sequelize.transaction();

  try {
    // 🔒 Lock the transferRequest row
    const transferRequest = await TransferRequests.findOne({
      where: {
        id: transferRequestId,
        status: "pending",
      },
      transaction: tran,
      lock: tran.LOCK.UPDATE, // <-- Row-level lock here
    });

    if (!transferRequest) {
      await tran.rollback();
      return callback(new Error("TRANSFER_NOT_FOUND_OR_NOT_PENDING"), null);
    }

    if (transferRequest.receiverId !== userId) {
      await tran.rollback();
      return callback(new Error("UNAUTHORIZED_ACCESS"), null);
    }

    if (status === "rejected") {
      const ct = { status: "rejected" };
      const deviceLocationLatLng = deviceLocation || "";
      if (deviceLocationLatLng) {
        const [latitude, longitude] = deviceLocationLatLng.split(",");
        ct.receiverLatitude = parseFloat(latitude);
        ct.receiverLongitude = parseFloat(longitude);
      }

      await transferRequest.update(
         ct,
        { transaction: tran }
      );
      await tran.commit();

      NotificationService.updatePendingTransferRequestNotificationStatus(
        transferRequest.id,
        "rejected"
      );
      NotificationService.transferRequestRejectionNotification(
        transferRequest.id,
        i18n,
        autoRejected
      );

      return callback(null, {
        data: {
          transferRequest: {
            ...transferRequest.toJSON(),
            status: "rejected",
          },
          message: "TRANSFER_REQUEST_REJECTED_SUCCESSFULLY",
        },
      });
    }

    if (status === "accepted") {
      const receiverUserDetails = await UserService.getUserDetails(
        transferRequest.senderId
      ); // sender will receive money
      const senderUserDetails = await UserService.getUserDetails(
        transferRequest.receiverId
      ); // request receiver will send money

      // 🔒 Lock sender wallet row to prevent race conditions
      let senderWallet = await UserWallet.findOne({
        where: {
          userId: senderUserDetails.id,
          currency: transferRequest.currency,
        },
        transaction: tran,
        lock: tran.LOCK.UPDATE,
      });

      if (!senderWallet) {
        await tran.rollback();
        return callback(
          new Error("YOU_HAVE_NO_WALLET_FOR_REQUEST_CURRENCY"),
          null
        );
      }
      if (senderWallet.status !== "active" || senderWallet.locked === true) {
        await tran.rollback();
        return callback(new Error("CANT_SEND_MONEY"), null);
      }
      if (
        parseFloat(senderWallet.balance) < parseFloat(transferRequest.amount)
      ) {
        await tran.rollback();
        return callback(new Error("INSUFFICIENT_BALANCE"), null);
      }

      const senderOldBalance = parseFloat(senderWallet.balance);
      const newSenderBalance =
        senderOldBalance - parseFloat(transferRequest.amount);

      // 🔒 Lock receiver wallet row
      let receiverWallet = await UserWallet.findOne({
        where: {
          userId: receiverUserDetails.id,
          currency: transferRequest.currency,
        },
        transaction: tran,
        lock: tran.LOCK.UPDATE,
      });

      const oldReceiverBalance = receiverWallet
        ? parseFloat(receiverWallet.balance)
        : 0;
      const newReceiverBalance =
        parseFloat(transferRequest.amount) +
        (receiverWallet ? parseFloat(receiverWallet.balance) : 0);

      if (!receiverWallet) {
        receiverWallet = await UserWallet.create(
          {
            userId: receiverUserDetails.id,
            currency: transferRequest.currency,
            balance: 0,
          },
          { transaction: tran }
        );
      }

      // Update balances atomically
      await senderWallet.update(
        { balance: newSenderBalance },
        { transaction: tran }
      );

      await receiverWallet.update(
        { balance: newReceiverBalance },
        { transaction: tran }
      );
      const cty = { status: "approved" };
      const deviceLocationLatLng = deviceLocation || "";
      if (deviceLocationLatLng) {
        const [latitude, longitude] = deviceLocationLatLng.split(",");
        cty.receiverLatitude = parseFloat(latitude);
        cty.receiverLongitude = parseFloat(longitude);
      }
      await transferRequest.update(
        cty,
        { transaction: tran }
      );

      const receiverWalletTransaction = await WalletTransaction.create(
        {
          userId: receiverUserDetails.id,
          walletId: receiverWallet.id,
          type: "credit",
          paymentAmt: transferRequest.amount,
          paymentCurrency: transferRequest.currency,
          oldWalletBalance: oldReceiverBalance,
          newWalletBalance: newReceiverBalance,
          transferRequestId: transferRequest.id,
          description: i18n.__({ phrase: "TRANSFER_REQUEST_ACCEPTED_CREDITED", locale: "en" }, { amount: transferRequest.amount, currency: transferRequest.currency, receiverName: receiverUserDetails.name, receiverPhoneNumber: receiverUserDetails.phoneNumber, senderName: senderUserDetails.name, senderPhoneNumber: senderUserDetails.phoneNumber }),
          description_he: i18n.__({ phrase: "TRANSFER_REQUEST_ACCEPTED_CREDITED", locale: "he" }, { amount: transferRequest.amount, currency: transferRequest.currency, receiverName: receiverUserDetails.name, receiverPhoneNumber: receiverUserDetails.phoneNumber, senderName: senderUserDetails.name, senderPhoneNumber: senderUserDetails.phoneNumber }),
          status: "completed",
        },
        { transaction: tran }
      );

      const senderWalletTransaction = await WalletTransaction.create(
        {
          userId: senderUserDetails.id,
          walletId: senderWallet.id,
          type: "debit",
          paymentAmt: transferRequest.amount,
          paymentCurrency: transferRequest.currency,
          oldWalletBalance: senderOldBalance,
          newWalletBalance: newSenderBalance,
          transferRequestId: transferRequest.id,
          description: i18n.__({ phrase: "TRANSFER_REQUEST_ACCEPTED_DEBITED", locale: "en" }, { amount: transferRequest.amount, currency: transferRequest.currency, receiverName: receiverUserDetails.name, receiverPhoneNumber: receiverUserDetails.phoneNumber, senderName: senderUserDetails.name, senderPhoneNumber: senderUserDetails.phoneNumber }),
          description_he: i18n.__({ phrase: "TRANSFER_REQUEST_ACCEPTED_DEBITED", locale: "he" }, { amount: transferRequest.amount, currency: transferRequest.currency, receiverName: receiverUserDetails.name, receiverPhoneNumber: receiverUserDetails.phoneNumber, senderName: senderUserDetails.name, senderPhoneNumber: senderUserDetails.phoneNumber }),
          status: "completed",
        },
        { transaction: tran }
      );

      await tran.commit();

      NotificationService.updatePendingTransferRequestNotificationStatus(
        transferRequest.id,
        "approved"
      );
      NotificationService.transferRequestApprovalNotification(
        transferRequest.id,
        i18n
      );

      const receiverWalletWhoGetAmt = await UserWallet.findOne({
        where: {
          userId: receiverUserDetails.id,
          currency: transferRequest.currency,
        },
      });
      const senderWalletWhoSendAmt = await UserWallet.findOne({
        where: {
          userId: senderUserDetails.id,
          currency: transferRequest.currency,
        },
      });

      return callback(null, {
        data: {
          receiverWalletTransaction,
          senderWalletTransaction,
          receiverWalletWhoGetAmt,
          senderWalletWhoSendAmt,
          transferRequest: {
            ...transferRequest.toJSON(),
            status: "approved",
          },
        },
      });
    }
  } catch (error) {
    if (tran?.finished !== "commit") {
      await tran.rollback();
    }
    process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
    return handleCallback(
      new Error("FAILED_TO_ACCEPT_REJECT_TRANSFER_REQUEST"),
      null,
      callback
    );
  }
}


static async rejectTransferRequestBySender(  { transferRequestId, userId,   i18n },
  callback){
      const tran = await db.sequelize.transaction();

  try {
    const transferRequest = await TransferRequests.findOne({
      where: {
        id: transferRequestId,
        status: "pending",
      },
      transaction: tran,
      lock: tran.LOCK.UPDATE, // <-- Row-level lock here
    });
    if (!transferRequest) {
      await tran.rollback();
      return callback(new Error("TRANSFER_NOT_FOUND_OR_NOT_PENDING"), null);
    }

    if (transferRequest.senderId !== userId) {
      await tran.rollback();
      return callback(new Error("UNAUTHORIZED_ACCESS"), null);
    }

      await transferRequest.update(
        { status: "rejected" },
        { transaction: tran }
      );
      await tran.commit();

      NotificationService.updatePendingTransferRequestNotificationStatus(
        transferRequest.id,
        "rejected"
      );
      NotificationService.transferRequestRejectionBySenderNotification(
        transferRequest.id,
        i18n
      );

      return callback(null, {
        data: {
          transferRequest: {
            ...transferRequest.toJSON(),
            status: "rejected",
          },
          message: "TRANSFER_REQUEST_REJECTED_SUCCESSFULLY",
        },
      });
  } catch (error) {
    if (tran?.finished !== "commit") {
      await tran.rollback();
    }
    console.log(error);
    process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
    return handleCallback(
      new Error("FAILED_TO_REJECT_TRANSFER_REQUEST"),
      null,
      callback
    );
  }


}


  static async getTransferRequestById(transferRequestId, callback) {
    try {
      const transfer = await TransferRequests.findOne({
        where: {
          id: transferRequestId,
        },
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["name", "phoneNumber"],
          },
          {
            model: User,
            as: "receiver",
            attributes: ["name", "phoneNumber"],
          },
        ],
      });

      if (!transfer) {
        return handleCallback(
          new Error("TRANSFER_REQUEST_NOT_FOUND"),
          null,
          callback
        );
      }
      return handleCallback(null, { data: transfer }, callback);
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return handleCallback(error, null, callback);
    }
  }

  static async getTransferRequestHistory(
    { userId, page = 1, limit = 10, filter = {} },
    callback
  ) {
    try {
      let whereClause = {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      };

      if (
        filter.type &&
        filter.type.length === 1 &&
        filter.type.includes("incoming")
      ) {
        whereClause = { receiverId: userId };
      } else if (
        filter.type &&
        filter.type.length === 1 &&
        filter.type.includes("outgoing")
      ) {
        whereClause = { senderId: userId };
      } else if (
        filter.type &&
        Array.isArray(filter.type) &&
        filter.type.includes("incoming") &&
        filter.type.includes("outgoing")
      ) {
        whereClause = {
          [Op.or]: [{ senderId: userId }, { receiverId: userId }],
        };
      }
      // console.log("Where Clause:", whereClause);
      if (filter.status && filter.status.length > 0) {
        whereClause.status = { [Op.in]: filter.status };
      }

      const transfers = await TransferRequests.findAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: (page - 1) * limit,
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["name", "phoneNumber"],
          },
          {
            model: User,
            as: "receiver",
            attributes: ["name", "phoneNumber"],
          },
        ],
      });

      return callback(null, { data: transfers });
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(error, null);
    }
  }

  static async getExpiredTransferRequests() {
    try {
      const expiredTransferRequests = await TransferRequests.findAll({
        where: {
          status: "pending",
          createdAt: {
            [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Created more than 24 hours ago
          },
        },
        limit: 10,
        offset: 0,
      });
      return expiredTransferRequests;
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      throw new Error("FAILED_TO_GET_EXPIRED_TRANSFERS");
    }
  }
}
