export async function up(queryInterface, Sequelize) {
  // Remove unique constraint from phone_number in users table
  await queryInterface.removeConstraint('users', 'users_phone_number_key');
}

export async function down(queryInterface, Sequelize) {
  // Add unique constraint back to phone_number in users table
  await queryInterface.addConstraint('users', {
    fields: ['phone_number'],
    type: 'unique',
    name: 'users_phone_number_key',
  });
}
