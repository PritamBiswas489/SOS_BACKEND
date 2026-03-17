export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('user_settings', {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    shake_sensitivity: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'medium'
    },
    silent_mode_alert: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    share_location_with: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'trusted_only'
    },
    fake_call_number: {
      type: Sequelize.STRING(20),
      allowNull: true
    },
    language: {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'en'
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
     created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    supportsSearchPath: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('user_settings', { supportsSearchPath: false });
}
