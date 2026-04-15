export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "user_location_history",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
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
      roomId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      latitude: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      altitude: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      accuracy: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      heading: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      speed: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      isBackground: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("user_location_history", {
    supportsSearchPath: false,
  });
}
