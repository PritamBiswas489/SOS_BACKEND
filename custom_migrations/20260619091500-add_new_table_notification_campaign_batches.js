export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "notification_campaign_batches",
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
      batch_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      batch_offset: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      batch_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      first_user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      last_user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      rows_inserted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      finished_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "running",
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("notification_campaign_batches", ["campaign_id"], {
    name: "notification_campaign_batches_campaign_id_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex(
    "notification_campaign_batches",
    ["campaign_id", "batch_number"],
    {
      name: "notification_campaign_batches_campaign_id_batch_number_uidx",
      unique: true,
      supportsSearchPath: false,
    },
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("notification_campaign_batches", {
    supportsSearchPath: false,
  });
}
