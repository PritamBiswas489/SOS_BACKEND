const relation = (db) => {
  const { User, Licenses, UserSettings, Devices, UserKycDocuments, TrustedContacts, UserChats, SosSessions, SosSessionNotifications, SosSessionAudioRecords, HeartRateRecords, Abusers, AbuserReports, AbuserReportEvidenceFiles, AppFeedback, AppFeedbackAttachments, RequestIosEmail, ContactAdmin, EmergencyServices } = db;

  // Define the one-to-one relationship between User and Licenses
  User.hasOne(Licenses, {
    foreignKey: "user_id",
    as: "licenses",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  Licenses.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
  User.hasOne(UserSettings, {
    foreignKey: "user_id",
    as: "settings",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  UserSettings.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
  User.hasMany(Devices, {
    foreignKey: "user_id",
    as: "devices",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  Devices.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
  User.hasOne(UserKycDocuments, {
    foreignKey: "user_id",
    as: "kyc_documents",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  UserKycDocuments.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });


   
  User.belongsTo(User, {
    foreignKey: "ngo_id",
    as: "ngo",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  User.hasOne(User, {
    foreignKey: "ngo_id",
    as: "users",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });


  User.hasMany(TrustedContacts, {
    foreignKey: "user_id",
    as: "trusted_contacts",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  TrustedContacts.belongsTo(User, {
    foreignKey: "user_id",
    as: "inviter",
  });
  TrustedContacts.belongsTo(User, {
    foreignKey: "trusted_user_id",
    as: "trusted_contact",
  });

  UserChats.belongsTo(UserChats, {
    foreignKey: "reply_to",
    as: "reply_to_message",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  UserChats.hasMany(UserChats, {
    foreignKey: "reply_to",
    as: "replies",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  User.hasMany(SosSessions, {
    foreignKey: "user_id",
    as: "sos_sessions",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  SosSessions.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
  SosSessions.belongsTo(User, {
    foreignKey: "resolved_by",
    as: "resolver",
  });
  User.hasMany(SosSessions, {
    foreignKey: "resolved_by",
    as: "resolved_sos_sessions",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  SosSessions.hasMany(SosSessionNotifications, {
    foreignKey: "sos_session_id",
    as: "notifications",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  SosSessionNotifications.belongsTo(SosSessions, {
    foreignKey: "sos_session_id",
    as: "sos_session",
  });
  SosSessionNotifications.belongsTo(User, {
    foreignKey: "to_user_id",
    as: "to_user",
  });
  User.hasMany(SosSessionNotifications, {
    foreignKey: "to_user_id",
    as: "sos_session_notifications",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  SosSessions.hasMany(SosSessionAudioRecords, {
    foreignKey: "sos_session_id",
    as: "audio_records",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  SosSessionAudioRecords.belongsTo(SosSessions, {
    foreignKey: "sos_session_id",
    as: "sos_session",
  });

  User.hasMany(HeartRateRecords, {
    foreignKey: "user_id",
    as: "heart_rate_records",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  HeartRateRecords.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  User.hasMany(Abusers, {
    foreignKey: "user_id",
    as: "abusers",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  Abusers.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  User.hasMany(AbuserReports, {
    foreignKey: "user_id",
    as: "abuser_reports",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  AbuserReports.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
  Abusers.hasMany(AbuserReports, {
    foreignKey: "abuser_id",
    as: "reports",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  AbuserReports.belongsTo(Abusers, {
    foreignKey: "abuser_id",
    as: "abuser",
  });
  AbuserReports.hasMany(AbuserReportEvidenceFiles, {
    foreignKey: "report_id",
    as: "evidence_files",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  AbuserReportEvidenceFiles.belongsTo(AbuserReports, {
    foreignKey: "report_id",
    as: "report",
  });
  AppFeedback.hasMany(AppFeedbackAttachments, {
    foreignKey: "feedback_id",
    as: "feedback_files",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  User.hasMany(AppFeedback, {
    foreignKey: "user_id",
    as: "app_feedbacks",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  AppFeedback.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
  AppFeedbackAttachments.belongsTo(AppFeedback, {
    foreignKey: "feedback_id",
    as: "feedback",
  });

  User.hasMany(RequestIosEmail, {
    foreignKey: "userId",
    as: "request_ios_emails",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  RequestIosEmail.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  User.hasMany(ContactAdmin, {
    foreignKey: "userId",
    as: "contact_admins",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  ContactAdmin.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  User.hasMany(EmergencyServices, {
    foreignKey: "requestBy",
    as: "emergency_services",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  EmergencyServices.belongsTo(User, {
    foreignKey: "requestBy",
    as: "user",
  });

};

export default relation;
