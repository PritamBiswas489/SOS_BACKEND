export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "request_ios_email",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      testFlightEmail: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("new", "added", "failed"),
        allowNull: false,
        defaultValue: "new",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("request_ios_email", ["userId"], {
    name: "idx_request_ios_email_user_id",
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex(
    "request_ios_email",
    "idx_request_ios_email_user_id",
    { supportsSearchPath: false },
  );

  await queryInterface.dropTable("request_ios_email", {
    supportsSearchPath: false,
  });
}
