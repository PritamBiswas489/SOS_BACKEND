export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "notification_recipients",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      campaign_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "notification_campaigns",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      channel: {
        type: Sequelize.ENUM("email", "push"),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      push_token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      device_platform: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "pending",
          "sent",
          "delivered",
          "opened",
          "clicked",
          "failed",
          "bounced",
          "unsubscribed",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      provider_msg_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      opened_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      clicked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      retry_count: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },

      // Model has timestamps: true, updatedAt: false -> table only has created_at
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("notification_recipients", ["campaign_id"], {
    name: "notification_recipients_campaign_id_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("notification_recipients", ["user_id"], {
    name: "notification_recipients_user_id_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("notification_recipients", ["status"], {
    name: "notification_recipients_status_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex(
    "notification_recipients",
    ["campaign_id", "user_id", "channel"],
    {
      name: "notification_recipients_campaign_id_user_id_channel_uidx",
      unique: true,
      supportsSearchPath: false,
    },
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("notification_recipients", {
    supportsSearchPath: false,
  });

  // Sequelize does not drop ENUM types automatically on dropTable (Postgres)
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_notification_recipients_channel";',
  );
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_notification_recipients_status";',
  );
}
