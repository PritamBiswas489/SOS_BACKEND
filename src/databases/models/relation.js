const relation = (db) => {
  const { User, Licenses, UserSettings, Devices, UserKycDocuments, TrustedContacts, UserChats  } = db;

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

  

};

export default relation;
