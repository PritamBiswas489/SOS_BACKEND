export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('otp_verifications', {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    phone_number: {
      type: Sequelize.STRING(20),
      allowNull: false
    },
    otp_code: {
      type: Sequelize.STRING(10),
      allowNull: false
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    is_used: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
  }, {
    supportsSearchPath: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('otp_verifications', { supportsSearchPath: false });
}
