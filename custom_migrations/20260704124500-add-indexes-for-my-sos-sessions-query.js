export async function up(queryInterface, Sequelize) {
  // Optimizes: WHERE user_id = ? ORDER BY created_at DESC
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_sos_sessions_user_created_at_desc
    ON sos_sessions(user_id, created_at DESC);
  `);

  // Optimizes: WHERE user_id = ? AND status = ? ORDER BY created_at DESC
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_sos_sessions_user_status_created_at_desc
    ON sos_sessions(user_id, status, created_at DESC);
  `);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(`
    DROP INDEX IF EXISTS idx_sos_sessions_user_created_at_desc;
  `);

  await queryInterface.sequelize.query(`
    DROP INDEX IF EXISTS idx_sos_sessions_user_status_created_at_desc;
  `);
}