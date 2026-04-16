export async function up(queryInterface, Sequelize) {
  await queryInterface.addIndex("user_location_history", ["user_id"], {
    name: "idx_user_location_history_user_id"
  },{
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex("user_location_history", "idx_user_location_history_user_id",{
        supportsSearchPath: false,
  });
}
