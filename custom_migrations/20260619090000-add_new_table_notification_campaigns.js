export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "notification_campaigns",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      // Email content
      subject: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      body_html: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      body_text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      template_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      // Push content
      push_title: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      push_body: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      push_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      push_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },

      target_type: {
        type: Sequelize.ENUM("all", "user_type", "specific"),
        allowNull: false,
      },
      channel: {
        type: Sequelize.ENUM("email", "push", "both"),
        allowNull: false,
        defaultValue: "email",
      },
      status: {
        type: Sequelize.ENUM(
          "draft",
          "scheduled",
          "resolving",
          "sending",
          "sent",
          "failed",
          "cancelled",
        ),
        allowNull: false,
        defaultValue: "draft",
      },

      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      total_recipients: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sent_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failed_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      opened_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      // Batch resolution checkpoint
      resolve_batch_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 500,
      },
      resolve_offset: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      resolve_last_user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      resolve_total_matched: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      resolve_completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("notification_campaigns", ["created_by"], {
    name: "notification_campaigns_created_by_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("notification_campaigns", ["status"], {
    name: "notification_campaigns_status_idx",
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("notification_campaigns", {
    supportsSearchPath: false,
  });

  // Sequelize does not drop ENUM types automatically on dropTable (Postgres)
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_notification_campaigns_target_type";',
  );
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_notification_campaigns_channel";',
  );
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_notification_campaigns_status";',
  );
}
