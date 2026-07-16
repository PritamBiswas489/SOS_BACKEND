export default function NotificationCampaign(sequelize, DataTypes) {
  const NotificationCampaign = sequelize.define(
    "NotificationCampaign",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      // Email content
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      body_html: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      body_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      template_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },

      // Push content
      push_title: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      push_body: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      push_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      push_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },

      target_type: {
        type: DataTypes.ENUM("all", "user_type", "specific"),
        allowNull: false,
      },
      channel: {
        type: DataTypes.ENUM("email", "push", "both"),
        allowNull: false,
        defaultValue: "email",
      },
      status: {
        type: DataTypes.ENUM(
          "draft",
          "scheduled",
          "resolving",
          "sending",
          "sent",
          "failed",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "draft",
      },

      scheduled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      total_recipients: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sent_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failed_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      opened_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      // Batch resolution checkpoint
      resolve_batch_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 500,
      },
      resolve_offset: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      resolve_last_user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      resolve_total_matched: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      resolve_completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      created_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "notification_campaigns",
      timestamps: false,
    }
  );

  return NotificationCampaign;
}
