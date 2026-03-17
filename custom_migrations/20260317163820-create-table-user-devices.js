export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('devices', {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    device_token: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    device_type: {
      type: Sequelize.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['android', 'ios', 'web']]
      }
    },
    app_version: {
      type: Sequelize.STRING(20),
      allowNull: true
    },
    os_version: {
      type: Sequelize.STRING(20),
      allowNull: true
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    push_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    last_login: {
      type: Sequelize.DATE,
      allowNull: true
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
  await queryInterface.dropTable('devices', { supportsSearchPath: false });
}
