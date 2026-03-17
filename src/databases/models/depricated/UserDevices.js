import moment from "moment-timezone";
import "../../config/environment.js";
export default function UserDevices(sequelize, DataTypes) {
  const UserDevices = sequelize.define(
    "UserDevices",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      deviceName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      deviceID: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      deviceType: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lastLoggedInLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      firstLoggedIn: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      lastLoggedIn: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      latitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "user_devices",
      timestamps: true,
    }
  );

 

  return UserDevices;
}
