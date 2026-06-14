export async function up(queryInterface, Sequelize) {
  await queryInterface.removeConstraint('licenses', 'licenses_license_key_key');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addConstraint('licenses', {
    fields: ['license_key'],
    type: 'unique',
    name: 'licenses_license_key_key',
  });
}
