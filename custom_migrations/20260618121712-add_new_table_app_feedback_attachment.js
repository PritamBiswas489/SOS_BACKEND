export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "app_feedback_attachments",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      feedback_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "app_feedback",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      file_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      file_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("app_feedback_attachments", ["feedback_id"], {
    name: "app_feedback_attachments_feedback_id_idx",
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("app_feedback_attachments", {
    supportsSearchPath: false,
  });
}
