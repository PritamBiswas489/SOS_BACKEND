export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('devices', 'device_id', {
    type: Sequelize.STRING(255),
    allowNull: true,
    after: 'user_id'
  },{
    supportsSearchPath: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('devices', 'device_id',{
    supportsSearchPath: false
  });
}
