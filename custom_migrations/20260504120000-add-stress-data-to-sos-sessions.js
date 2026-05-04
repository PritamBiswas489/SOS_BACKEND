export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn(
    "sos_sessions",
    "stress_data",
    {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    },
    {
      supportsSearchPath: false,
    },
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("sos_sessions", "stress_data", {
    supportsSearchPath: false,
  });
}
