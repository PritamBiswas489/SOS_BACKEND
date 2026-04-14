export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'first_time_login', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },{
     supportsSearchPath: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('users', 'first_time_login',{
     supportsSearchPath: false
  });
}
