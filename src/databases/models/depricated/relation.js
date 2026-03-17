const relation = (db) => {
  const { User, UserCard, WalletPelePayment, WalletTransaction, WalletAirwallexPayments, UserWallet, ApiLogs, UserKyc, UserDevices, UserFcm, Transfer, Notification, TransferRequests, UserSettings, PisoPayTransactionInfos, ExpensesCategories, NinePayTransactionInfos, kessPayTransactionInfos, Feedbacks, FeedbackCategory, Suggestions, SuggestionType, SuggestionPriorityLevel, BugReports, BugPlace, BugSeverity } = db;

  //user saved cards
  User.hasMany(UserCard, { foreignKey: "userId", as : "cards" });
  UserCard.belongsTo(User, { foreignKey: "userId", as : "user" });

  //user saved pele payments
  User.hasMany(WalletPelePayment, { foreignKey: "userId", as: "walletPayments" });
  WalletPelePayment.belongsTo(User, { foreignKey: "userId", as: "user" });

  //user wallets
  User.hasMany(UserWallet, { foreignKey: "userId", as: "wallets" });
  UserWallet.belongsTo(User, { foreignKey: "userId", as: "user" });

  User.hasMany(ApiLogs, { foreignKey: "userId", as: "apiLogs" });
  ApiLogs.belongsTo(User, { foreignKey: "userId", as: "user" });

  User.hasOne(UserKyc, { foreignKey: "userId", as: "kyc" });
  UserKyc.belongsTo(User, { foreignKey: "userId", as: "user" });

  User.hasMany(UserDevices, { foreignKey: "userId", as: "devices" }); 
  UserDevices.belongsTo(User, { foreignKey: "userId", as: "user" });  

  User.hasMany(UserFcm, { foreignKey: "userId", as: "fcm" });
  UserFcm.belongsTo(User, { foreignKey: "userId", as: "user" }); 
  
  //WalletTransaction may belong to WalletPelePayment via paymentId (nullable)
  WalletPelePayment.hasOne(WalletTransaction, { foreignKey: "paymentId", as: "transaction" });
  WalletTransaction.belongsTo(WalletPelePayment, { foreignKey: "paymentId", as: "walletPayment" });



  WalletAirwallexPayments.hasOne(WalletTransaction, { foreignKey: "airwallexPaymentId", as: "transaction" });
  WalletTransaction.belongsTo(WalletAirwallexPayments, { foreignKey: "airwallexPaymentId", as: "walletAirwallexPayment" });

  User.hasMany(WalletTransaction, { foreignKey: "userId", as: "transactions" });
  WalletTransaction.belongsTo(User, { foreignKey: "userId", as: "user" });

  //user settings
  User.hasMany(UserSettings, { foreignKey: "userId", as: "settings" });
  UserSettings.belongsTo(User, { foreignKey: "userId", as: "user" });

  //Transfer model relations
  User.hasMany(Transfer, { foreignKey: "senderId", as: "sentTransfers" });
  User.hasMany(Transfer, { foreignKey: "receiverId", as: "receivedTransfers" });
  Transfer.belongsTo(User, { foreignKey: "senderId", as: "sender" });
  Transfer.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });


  //TransferRequests model relations
  User.hasMany(TransferRequests, { foreignKey: "senderId", as: "sentTransferRequests" });
  User.hasMany(TransferRequests, { foreignKey: "receiverId", as: "receivedTransferRequests" });
  TransferRequests.belongsTo(User, { foreignKey: "senderId", as: "sender" });
  TransferRequests.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });


  WalletTransaction.belongsTo(Transfer, { foreignKey: "transferId", as: "transfer" });
  Transfer.hasMany(WalletTransaction, { foreignKey: "transferId", as: "transactions" });


  WalletTransaction.belongsTo(TransferRequests, { foreignKey: "transferRequestId", as: "transferRequest" });
  TransferRequests.hasMany(WalletTransaction, { foreignKey: "transferRequestId", as: "transactions" });

  WalletTransaction.belongsTo(PisoPayTransactionInfos, { foreignKey: "pisoPayTransactionId", as: "pisopayTransaction" });
  PisoPayTransactionInfos.hasMany(WalletTransaction, { foreignKey: "pisoPayTransactionId", as: "transactions" });


  WalletTransaction.belongsTo(kessPayTransactionInfos, { foreignKey: "kesspayTransactionId", as: "kesspayTransaction" });
  kessPayTransactionInfos.hasMany(WalletTransaction, { foreignKey: "kesspayTransactionId", as: "transactions" });


  Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });


  PisoPayTransactionInfos.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(PisoPayTransactionInfos, { foreignKey: "userId", as: "pisopayTransactions" });

  PisoPayTransactionInfos.belongsTo(ExpensesCategories, { foreignKey: "expenseCatId", as: "expenseCategory" });
  ExpensesCategories.hasMany(PisoPayTransactionInfos, { foreignKey: "expenseCatId", as: "pisopayTransactions" });

    
  kessPayTransactionInfos.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(kessPayTransactionInfos, { foreignKey: "userId", as: "kesspayTransactions" });

  kessPayTransactionInfos.belongsTo(ExpensesCategories, { foreignKey: "expenseCatId", as: "expenseCategory" });
  ExpensesCategories.hasMany(kessPayTransactionInfos, { foreignKey: "expenseCatId", as: "kesspayTransactions" });



  WalletTransaction.belongsTo(NinePayTransactionInfos, { foreignKey: "ninePayTransactionId", as: "ninePayTransaction" });
  NinePayTransactionInfos.hasMany(WalletTransaction, { foreignKey: "ninePayTransactionId", as: "transactions" });


  NinePayTransactionInfos.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(NinePayTransactionInfos, { foreignKey: "userId", as: "ninePayTransactions" });

  NinePayTransactionInfos.belongsTo(ExpensesCategories, { foreignKey: "expenseCatId", as: "expenseCategory" });
  ExpensesCategories.hasMany(NinePayTransactionInfos, { foreignKey: "expenseCatId", as: "ninePayTransactions" });

  Feedbacks.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Feedbacks, { foreignKey: "userId", as: "feedbacks" });

  Feedbacks.belongsTo(FeedbackCategory, { foreignKey: "categoryId", as: "category" });
  FeedbackCategory.hasMany(Feedbacks, { foreignKey: "categoryId", as: "feedbacks" });



  Suggestions.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Suggestions, { foreignKey: "userId", as: "suggestions" });
  Suggestions.belongsTo(SuggestionType, { foreignKey: "typeId", as: "type" });
  SuggestionType.hasMany(Suggestions, { foreignKey: "typeId", as: "suggestions" });
  Suggestions.belongsTo(SuggestionPriorityLevel, { foreignKey: "levelId", as: "priorityLevel" });
  SuggestionPriorityLevel.hasMany(Suggestions, { foreignKey: "levelId", as: "suggestions" });


  BugReports.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(BugReports, { foreignKey: "userId", as: "bugReports" });
  BugReports.belongsTo(BugSeverity, { foreignKey: "severityId", as: "severity" });
  BugSeverity.hasMany(BugReports, { foreignKey: "severityId", as: "bugReports" });
  BugReports.belongsTo(BugPlace, { foreignKey: "placeId", as: "place" });
  BugPlace.hasMany(BugReports, { foreignKey: "placeId", as: "bugReports" });

};

export default relation;
