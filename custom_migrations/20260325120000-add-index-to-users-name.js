export async function up(queryInterface, Sequelize) {
  await queryInterface.addIndex('users', ['name'], {
    name: 'users_name_idx',
    fields: ['name'],
    unique: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('users', 'users_name_idx');
}
