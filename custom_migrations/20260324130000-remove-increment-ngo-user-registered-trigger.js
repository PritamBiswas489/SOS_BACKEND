export async function up(queryInterface, Sequelize) {
  // Drop function with CASCADE — automatically drops the dependent trigger too
  await queryInterface.sequelize.query(`
    DROP FUNCTION IF EXISTS increment_ngo_user_registered() CASCADE;
  `);
}

export async function down(queryInterface, Sequelize) {
  // Re-create the function
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION increment_ngo_user_registered()
    RETURNS TRIGGER AS $$
    BEGIN
      -- your original logic here
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Re-create the trigger
  await queryInterface.sequelize.query(`
    CREATE TRIGGER trg_increment_ngo_user_registered
    AFTER INSERT ON public."Users"
    FOR EACH ROW
    EXECUTE FUNCTION increment_ngo_user_registered();
  `);
}