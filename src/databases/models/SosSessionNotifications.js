export default function SosSessionNotifications(sequelize, DataTypes) {
  const SosSessionNotifications = sequelize.define(
    "SosSessionNotifications",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      sos_session_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "sos_sessions",
          key: "id",
        },
      },
      to_user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      response_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending",
      },
      alert_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "sos_session_notifications",
      timestamps: false,
    }
  );

  return SosSessionNotifications;
}
