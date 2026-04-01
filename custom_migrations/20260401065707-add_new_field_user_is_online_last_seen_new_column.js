export async function up(queryInterface, Sequelize) {
  console.log('🟢 Migration running: add is_online and last_seen to users');

  await queryInterface.addColumn('users', 'is_online', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn('users', 'last_seen', {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },{
    supportsSearchPath: false
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'last_seen',{
    supportsSearchPath: false
  });
  await queryInterface.removeColumn('users', 'is_online',{
    supportsSearchPath: false
  });
}
