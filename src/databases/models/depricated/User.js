export default function User(sequelize, DataTypes) {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dob: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM,
        values: ["ADMIN", "USER", "SELLER", "BOTH"],
        allowNull: true,
        defaultValue: "USER",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
      },
      language: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "he",
      },
      hexSalt: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      logged_device_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "users",
    }
  );

  return User;
}
