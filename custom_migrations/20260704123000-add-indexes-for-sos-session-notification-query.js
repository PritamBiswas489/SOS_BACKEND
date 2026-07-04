export async function up(queryInterface, Sequelize) {
  // Optimizes inbox query: WHERE to_user_id = ? ORDER BY created_at DESC
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_sos_session_notifications_to_user_created_at_desc
    ON sos_session_notifications(to_user_id, created_at DESC);
  `);

  // Optimizes lookups/updates by session and receiver in notification workflow.
  await queryInterface.addIndex("sos_session_notifications", ["sos_session_id", "to_user_id"], {
    name: "idx_sos_session_notifications_session_to_user",
  });

  // Optimizes optional status filter applied through included sos_session model.
  await queryInterface.addIndex("sos_sessions", ["status"], {
    name: "idx_sos_sessions_status",
  });

  // Optimizes join loading of audio records by sos_session_id.
  await queryInterface.addIndex("sos_session_audio_records", ["sos_session_id"], {
    name: "idx_sos_session_audio_records_session_id",
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(`
    DROP INDEX IF EXISTS idx_sos_session_notifications_to_user_created_at_desc;
  `);

  await queryInterface.removeIndex(
    "sos_session_notifications",
    "idx_sos_session_notifications_session_to_user"
  );
  await queryInterface.removeIndex("sos_sessions", "idx_sos_sessions_status");
  await queryInterface.removeIndex(
    "sos_session_audio_records",
    "idx_sos_session_audio_records_session_id"
  );
}