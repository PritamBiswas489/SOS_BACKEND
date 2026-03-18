import db from "../databases/models/index.js";
import InterestRatesService from "../services/interestRates.service.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import TrackIpAddressDeviceIdService from "../services/trackIpAddressDeviceId.service.js";
import FaqService from "../services/faq.service.js";
import { hashStr, compareHashedStr, generateToken } from "../libraries/auth.js";
import CronTrackService from "../services/crontrack.service.js";
import FeedbackService from "../services/feedbackService.js";
import SuggestionService from "../services/suggestionService.js";
import BugReportService from "../services/bugReportService.js";
import moment from "moment";
const {
  User,
  Op,
  WalletTransaction,
  WalletPelePayment,
  Transfer,
  TransferRequests,
  UserKyc,
  UserWallet,
  UserFcm,
  Feedbacks,
  FeedbackCategory,
  Suggestions,
  SuggestionType,
  SuggestionPriorityLevel,
  BugSeverity,
  BugPlace,
  BugReports,
  PisoPayTransactionInfos, // Philippines
  kessPayTransactionInfos, //  Cambodia
  NinePayTransactionInfos, // Vietnam
  ExpensesCategories
} = db;

 
export default class AdminController {
  static async adminLogin(request) {
    //login by email and password
    const {
      payload,
      headers: { i18n },
    } = request;
    try {
      //email and password login logic
      if (!payload.email || !payload.password) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("EMAIL_AND_PASSWORD_REQUIRED") },
        };
      }
      const adminUser = await User.findOne({
        where: {
          email: payload.email,
          role: "ADMIN",
        },
      });
      if (!adminUser) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("ADMIN_USER_NOT_FOUND") },
        };
      }
      const isPasswordValid = await compareHashedStr(
        payload.password,
        adminUser.password
      );
      if (!isPasswordValid) {
        return {
          status: 401,
          data: [],
          error: { message: i18n.__("INVALID_PASSWORD") },
        };
      }

      return {
        status: 200,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
        message: i18n.__("ADMIN_LOGIN_SUCCESS"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getUserList(request) {
    const {
      payload,
      headers: { i18n },
    } = request;
    try {
      const page = parseInt(payload.page, 10) || 1;
      const limit = parseInt(payload.limit, 10) || 10;
      const offset = (page - 1) * limit;

      const whereClause = { role: "USER" };
      if (payload.search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${payload.search}%` } },
          { email: { [Op.like]: `%${payload.search}%` } },
          { phoneNumber: { [Op.like]: `%${payload.search}%` } },
        ];
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        attributes: { exclude: ["password"] },
        include: [
          {
            model: UserKyc,
            as: "kyc",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: UserWallet,
            as: "wallets",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
        ],
        distinct: true, // Ensures correct count when using include
      });

      return {
        status: 200,
        data: users.rows,
        pagination: {
          totalItems: users.count,
          totalPages: Math.ceil(users.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("USER_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getUserById(request) {
    const {
      payload,
      headers: { i18n },
    } = request;
    try {
      const user = await User.findByPk(payload.user_id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: UserKyc,
            as: "kyc",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: UserWallet,
            as: "wallets",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
        ],
      });
      if (!user) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("USER_NOT_FOUND") },
        };
      }
      return {
        status: 200,
        data: user,
        message: i18n.__("USER_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async changeUserStatus(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const userToUpdate = await User.findByPk(payload.user_id);
      if (!userToUpdate) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("USER_NOT_FOUND") },
        };
      }
      userToUpdate.status = payload.status;
      await userToUpdate.save();
      return {
        status: 200,
        data: userToUpdate,
        message: i18n.__("USER_STATUS_UPDATED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getInstallmentPaymentInterestRates(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const settings = await InterestRatesService.getInterestRates();
      if (settings.ERROR) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("CATCH_ERROR"),
            reason: "Error fetching settings",
          },
        };
      }
      return {
        status: 200,
        data: settings.data,
        message: i18n.__("SETTINGS_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async addInstallmentPaymentInterestRates(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      Object.values(payload).forEach((setting) => {
        InterestRatesService.addInterestRate(
          setting.payment_number,
          setting.interest_rate
        );
      });
      return {
        status: 200,
        data: [],
        message: i18n.__("SETTINGS_UPDATED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getApiEndpointLogs(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    const page = parseInt(payload.page, 10) || 1;
    const limit = parseInt(payload.limit, 10) || 10;
    try {
      const logs = await TrackIpAddressDeviceIdService.getApiEndpointLogs({
        page,
        limit,
      });
      if (logs.ERROR) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("CATCH_ERROR"),
            reason: "Error fetching API endpoint logs",
          },
        };
      }
      return {
        status: 200,
        data: logs.data,
        pagination: logs.pagination || { page, limit },
        message: i18n.__("API_LOGS_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async addFaq(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const faq = await FaqService.addFaq(
        payload.question,
        payload.answer,
        payload.order
      );
      if (faq.ERROR) {
        return {
          status: 500,
          data: [],
          error: {
            message: i18n.__("CATCH_ERROR"),
            reason: "Error adding FAQ",
          },
        };
      }
      return {
        status: 200,
        data: faq.data,
        message: i18n.__("FAQ_ADDED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getTransactionList(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const page = parseInt(payload.page, 10) || 1;
      const limit = parseInt(payload.limit, 10) || 10;
      const offset = (page - 1) * limit;
      // currency can be array or string
      let currency = payload.currency;
      if (typeof currency === "string") {
        currency = [currency];
      } else if (!Array.isArray(currency)) {
        currency = [];
      }
      console.log("Currency:", currency);
      // status can be array or string
      let status = payload.status;
      if (typeof status === "string") {
        status = [status];
      } else if (!Array.isArray(status)) {
        status = [];
      }
      // type can be array or string
      let type = payload.type;
      if (typeof type === "string") {
        type = [type];
      } else if (!Array.isArray(type)) {
        type = [];
      }
      let transaction_type = payload.transaction_type;
      if (typeof transaction_type === "string") {
        transaction_type = [transaction_type];
      } else if (!Array.isArray(transaction_type)) {
        transaction_type = [];
      }
      const fromDate = payload.fromDate
        ? moment(payload.fromDate).startOf("day")
        : null;
      const toDate = payload.toDate
        ? moment(payload.toDate).endOf("day")
        : null;
      const mobile = payload.mobile || null;
      const senderMobileNumber = payload.senderMobileNumber
        ? payload.senderMobileNumber
        : null;
      const receiverMobileNumber = payload.receiverMobileNumber
        ? payload.receiverMobileNumber
        : null;

      // Build where clause for transactions
      const whereClause = {};

      // Search by transactionId or userId
      if (payload.search) {
        whereClause[Op.or] = [
          { transactionId: { [Op.like]: `%${payload.search}%` } },
          { userId: { [Op.like]: `%${payload.search}%` } },
        ];
      }

      // Build transaction type filter
      if (transaction_type && transaction_type.length > 0) {
        whereClause[Op.or] = [
          ...(transaction_type.includes("wallet")
            ? [{ paymentId: { [Op.ne]: null } }]
            : []),
          ...(transaction_type.includes("transfer")
            ? [{ transferId: { [Op.ne]: null }, transferRequestId: null }]
            : []),
          ...(transaction_type.includes("transfer_request")
            ? [{ transferRequestId: { [Op.ne]: null } }]
            : []),
        ];
      }

      // Date filters
      if (fromDate && toDate) {
        whereClause.createdAt = {
          [Op.between]: [fromDate.toDate(), toDate.toDate()],
        };
      } else if (fromDate) {
        whereClause.createdAt = {
          [Op.gte]: fromDate.toDate(),
        };
      } else if (toDate) {
        whereClause.createdAt = {
          [Op.lte]: toDate.toDate(),
        };
      }

      // User phoneNumber filter (relation with User table)
      const userInclude = {
        model: User,
        as: "user",
        attributes: ["id", "name", "phoneNumber", "email"],
      };
      if (mobile) {
        userInclude.where = {
          phoneNumber: { [Op.like]: `%${mobile}%` },
        };
      }

      // Only add sender/receiver mobile filters if the value is not null/blank
      const isSenderMobileValid =
        senderMobileNumber && senderMobileNumber.trim() !== "";
      const isReceiverMobileValid =
        receiverMobileNumber && receiverMobileNumber.trim() !== "";

      const transferInclude = {
        model: Transfer,
        as: "transfer",
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name", "phoneNumber", "email"],
          },
          {
            model: User,
            as: "receiver",
            attributes: ["id", "name", "phoneNumber", "email"],
          },
        ],
      };

      const transferRequestInclude = {
        model: TransferRequests,
        as: "transferRequest",
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name", "phoneNumber", "email"],
          },
          {
            model: User,
            as: "receiver",
            attributes: ["id", "name", "phoneNumber", "email"],
          },
        ],
      };

      const walletInclude = {
        model: WalletPelePayment,
        as: "walletPayment",
        attributes: [
          "id",
          "PelecardTransactionId",
          "VoucherId",
          "CreditCardNumber",
          "Token",
          "CreditCardExpDate",
          "DebitApproveNumber",
          "CardHebName",
          "TotalPayments",
        ],
      };

      // If senderMobileNumber is null/blank, only show data where transfer.user.phoneNumber = senderMobileNumber
      // If receiverMobileNumber is null/blank, only show data where transferRequest.user.phoneNumber = receiverMobileNumber
      // This is already handled by the required: true and where clauses above

      const transactions = await WalletTransaction.findAndCountAll({
        where: {
          ...whereClause,
          ...(currency.length > 0 && {
            paymentCurrency: { [Op.in]: currency },
          }),
          ...(status && status.length > 0 && { status: { [Op.in]: status } }),
          ...(type && type.length > 0 && { type: { [Op.in]: type } }),
        },
        include: [
          userInclude,
          walletInclude,
          transferInclude,
          transferRequestInclude,
        ],
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: limit,
        distinct: true, // Ensures correct count when using include
      });

      return {
        status: 200,
        data: transactions.rows,
        pagination: {
          totalItems: transactions.count,
          totalPages: Math.ceil(transactions.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("TRANSACTION_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getTransactionById(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const transaction = await WalletTransaction.findByPk(payload.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "phoneNumber", "email"],
          },
          {
            model: WalletPelePayment,
            as: "walletPayment",
            attributes: [
              "id",
              "PelecardTransactionId",
              "VoucherId",
              "CreditCardNumber",
              "Token",
              "CreditCardExpDate",
              "DebitApproveNumber",
              "CardHebName",
              "TotalPayments",
            ],
          },
          {
            model: Transfer,
            as: "transfer",
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["id", "name", "phoneNumber", "email"],
              },
              {
                model: User,
                as: "receiver",
                attributes: ["id", "name", "phoneNumber", "email"],
              },
            ],
          },
          {
            model: TransferRequests,
            as: "transferRequest",
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["id", "name", "phoneNumber", "email"],
              },
              {
                model: User,
                as: "receiver",
                attributes: ["id", "name", "phoneNumber", "email"],
              },
            ],
          },
        ],
      });

      if (!transaction) {
        return {
          status: 404,
          data: [],
          error: { message: i18n.__("TRANSACTION_NOT_FOUND") },
        };
      }

      return {
        status: 200,
        data: transaction,
        message: i18n.__("TRANSACTION_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getTransactionListByUser(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const page = parseInt(payload.page, 10) || 1;
      const limit = parseInt(payload.limit, 10) || 10;
      const offset = (page - 1) * limit;
      const userId = payload.user_id;

      if (!userId) {
        return {
          status: 400,
          data: [],
          error: { message: i18n.__("USER_ID_REQUIRED") },
        };
      }

      const transactions = await WalletTransaction.findAndCountAll({
        where: { userId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "phoneNumber", "email"],
          },
          {
            model: WalletPelePayment,
            as: "walletPayment",
            attributes: [
              "id",
              "PelecardTransactionId",
              "VoucherId",
              "CreditCardNumber",
              "Token",
              "CreditCardExpDate",
              "DebitApproveNumber",
              "CardHebName",
              "TotalPayments",
            ],
          },
          {
            model: Transfer,
            as: "transfer",
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["id", "name", "phoneNumber", "email"],
              },
              {
                model: User,
                as: "receiver",
                attributes: ["id", "name", "phoneNumber", "email"],
              },
            ],
          },
          {
            model: TransferRequests,
            as: "transferRequest",
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["id", "name", "phoneNumber", "email"],
              },
              {
                model: User,
                as: "receiver",
                attributes: ["id", "name", "phoneNumber", "email"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
        offset,
        limit,
        distinct: true, // Ensures correct count when using include
      });

      return {
        status: 200,
        data: transactions.rows,
        pagination: {
          totalItems: transactions.count,
          totalPages: Math.ceil(transactions.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("TRANSACTION_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getCronTrackList(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const cronJobs = await CronTrackService.listCronTracks();

      return {
        status: 200,
        data: cronJobs?.data,
        message: i18n.__("CRON_TRACK_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  static async getFeedbackList(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const feedbackList = await Feedbacks.findAndCountAll({
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

      return {
        status: 200,
        data: feedbackList.rows,
        pagination: {
          totalItems: feedbackList.count,
          totalPages: Math.ceil(feedbackList.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("FEEDBACK_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getSuggestionList(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;

      const suggestionsData = await Suggestions.findAndCountAll({
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phoneNumber"],
          },
          { model: SuggestionType, as: "type" },
          { model: SuggestionPriorityLevel, as: "priorityLevel" },
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });

      return {
        status: 200,
        data: suggestionsData.rows,
        pagination: {
          totalItems: suggestionsData.count,
          totalPages: Math.ceil(suggestionsData.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("SUGGESTION_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
  static async getBugReportList(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const bugReportsData = await BugReports.findAndCountAll({
        include: [
          {
            model: BugSeverity,
            as: "severity",
          },
          {
            model: BugPlace,
            as: "place",
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phoneNumber"],
          },
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return {
        status: 200,
        data: bugReportsData.rows,
        pagination: {
          totalItems: bugReportsData.count,
          totalPages: Math.ceil(bugReportsData.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("BUG_REPORT_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  static async getPhilippinesPaymentList(request) {
    //PisoPayTransactionInfos
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const response = await PisoPayTransactionInfos.findAndCountAll({
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: limit,

        include: [
          {
            model: ExpensesCategories,
            as: "expenseCategory",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phoneNumber"],
          },
        ],
      });
       return {
        status: 200,
        data: response.rows,
        pagination: {
          totalItems: response.count,
          totalPages: Math.ceil(response.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("PHILIPPINES_PAYMENT_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  static async getVietnamPaymentList(request) {
    //NinePayTransactionInfos
    const {
      payload,
      headers: { i18n },
      user,
    } = request;


    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const response = await NinePayTransactionInfos.findAndCountAll({
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: limit,

        include: [
          {
            model: ExpensesCategories,
            as: "expenseCategory",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phoneNumber"],
          },
        ],
      });
       return {
        status: 200,
        data: response.rows,
        pagination: {
          totalItems: response.count,
          totalPages: Math.ceil(response.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("VIETNAM_PAYMENT_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }

  static async getCambodiaPaymentList(request) {
     const {
      payload,
      headers: { i18n },
      user,
    } = request;


    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const response = await kessPayTransactionInfos.findAndCountAll({
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: limit,

        include: [
          {
            model: ExpensesCategories,
            as: "expenseCategory",
            attributes: { exclude: ["createdAt", "updatedAt"] },
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phoneNumber"],
          },
        ],
      });
       return {
        status: 200,
        data: response.rows,
        pagination: {
          totalItems: response.count,
          totalPages: Math.ceil(response.count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
        message: i18n.__("VIETNAM_PAYMENT_LIST_FETCHED_SUCCESSFULLY"),
      };
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
      };
    }
  }
}
