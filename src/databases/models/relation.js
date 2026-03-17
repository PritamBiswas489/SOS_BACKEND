const relation = (db) => {
  const { User, Licenses, UserSettings, Devices } = db;

  // Define the one-to-many relationship between User and Licenses
  User.hasMany(Licenses, {
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
};

export default relation;
