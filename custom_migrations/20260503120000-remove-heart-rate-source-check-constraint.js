export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(`
    ALTER TABLE heart_rate_records
      DROP CONSTRAINT chk_heart_rate_source;
  `);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(`
    ALTER TABLE heart_rate_records
      ADD CONSTRAINT chk_heart_rate_source CHECK (source IN ('ble', 'googlefit'));
  `);
}
