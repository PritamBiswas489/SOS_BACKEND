export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "notification_campaign_user_types",
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
      user_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("notification_campaign_user_types", ["campaign_id"], {
    name: "notification_campaign_user_types_campaign_id_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex(
    "notification_campaign_user_types",
    ["campaign_id", "user_type"],
    {
      name: "notification_campaign_user_types_campaign_id_user_type_uidx",
      unique: true,
      supportsSearchPath: false,
    },
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("notification_campaign_user_types", {
    supportsSearchPath: false,
  });
}
