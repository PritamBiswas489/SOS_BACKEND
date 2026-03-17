export default function UserSettings(sequelize, DataTypes) {
  const UserSettings = sequelize.define(
    "UserSettings",
    {
      id:{
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
     },
        userId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "user_settings",
      timestamps: true, // Enables createdAt and updatedAt
    }
  );

  return UserSettings;
}
