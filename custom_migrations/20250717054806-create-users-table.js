export async function up(queryInterface, Sequelize) {
  console.log('🟢 Migration running: create-users');

  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING(150),
      allowNull: true
    },
    phone_number: {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true
    },
    email: {
      type: Sequelize.STRING(150),
      allowNull: true
    },
    password_hash: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    profile_photo: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    supportsSearchPath: false
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('users', { supportsSearchPath: false });
}
