export async function up(queryInterface, Sequelize) {
  // Add 'NGO' value to enum_users_role if not exists
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'NGO') THEN
        ALTER TYPE "enum_users_role" ADD VALUE 'NGO';
      END IF;
    END$$;
  `);
}

export async function down(queryInterface, Sequelize) {
  // No down migration for removing enum value (not supported in PostgreSQL)
}
