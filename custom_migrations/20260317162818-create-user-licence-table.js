export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('licenses', {
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
    license_key: {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true
    },
    license_type: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['active', 'expired', 'suspended']]
      }
    },
    expiry_date: {
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
  await queryInterface.dropTable('licenses', { supportsSearchPath: false });
}
