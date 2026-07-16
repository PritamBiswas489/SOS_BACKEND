export default function NotificationRecipient(sequelize, DataTypes) {
  const NotificationRecipient = sequelize.define(
    "NotificationRecipient",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      campaign_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "notification_campaigns",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      channel: {
        type: DataTypes.ENUM("email", "push"),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      push_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      device_platform: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM(
          "pending",
          "sent",
          "delivered",
          "opened",
          "clicked",
          "failed",
          "bounced",
          "unsubscribed"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      provider_msg_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      opened_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clicked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      failed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      retry_count: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },

      // Table only has created_at (no updated_at)
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "notification_recipients",
      timestamps: false,
    }
  );

  return NotificationRecipient;
}
