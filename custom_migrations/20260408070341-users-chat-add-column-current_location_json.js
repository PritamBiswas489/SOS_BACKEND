export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("user_chats", "location_json", {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: {},
  },{
    supportsSearchPath: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("user_chats", "location_json",{
    supportsSearchPath: false
  });
}
