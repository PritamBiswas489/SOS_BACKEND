export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "contact_admin",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
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
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("contact_admin", {
    supportsSearchPath: false,
  });
}
