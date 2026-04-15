export async function up(queryInterface, Sequelize) {
  // Add latitude and longitude columns to users table
  await queryInterface.addColumn('users', 'latitude', {
    type: Sequelize.DOUBLE,
    allowNull: true,
    comment: 'User latitude',
  },{
    supportsSearchPath: false
  });
  await queryInterface.addColumn('users', 'longitude', {
    type: Sequelize.DOUBLE,
    allowNull: true,
    comment: 'User longitude',
  },{
    supportsSearchPath: false
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove latitude and longitude columns from users table
  await queryInterface.removeColumn('users', 'latitude',{
    supportsSearchPath: false
  });
  await queryInterface.removeColumn('users', 'longitude',{
    supportsSearchPath: false
  });
}
