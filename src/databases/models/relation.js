const relation = (db) => {
  const { User, Licenses, UserSettings, Devices, UserKycDocuments, TrustedContacts, UserChats, SosSessions, SosSessionNotifications, SosSessionAudioRecords } = db;

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

};

export default relation;
