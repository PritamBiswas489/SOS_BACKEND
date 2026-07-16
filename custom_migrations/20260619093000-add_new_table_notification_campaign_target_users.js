export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "notification_campaign_target_users",
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
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("notification_campaign_target_users", ["campaign_id"], {
    name: "notification_campaign_target_users_campaign_id_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("notification_campaign_target_users", ["user_id"], {
    name: "notification_campaign_target_users_user_id_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex(
    "notification_campaign_target_users",
    ["campaign_id", "user_id"],
    {
      name: "notification_campaign_target_users_campaign_id_user_id_uidx",
      unique: true,
      supportsSearchPath: false,
    },
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("notification_campaign_target_users", {
    supportsSearchPath: false,
  });
}
