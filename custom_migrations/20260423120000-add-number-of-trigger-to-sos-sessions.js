export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("sos_sessions", "number_of_trigger", {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },{
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("sos_sessions", "number_of_trigger",{
    supportsSearchPath: false,
});
}
