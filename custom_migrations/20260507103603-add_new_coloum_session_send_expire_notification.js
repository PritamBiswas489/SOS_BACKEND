export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn(
    "sos_sessions",
    "before_expire_notification",
    {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    {
      supportsSearchPath: false,
    },
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("sos_sessions", "before_expire_notification", {
    supportsSearchPath: false,
  });
}
