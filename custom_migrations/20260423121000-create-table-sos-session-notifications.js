export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("sos_session_notifications", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    sos_session_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: "sos_sessions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    to_user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    response_status: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "pending",
    },
    alert_number: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  }, {
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("sos_session_notifications", {
    supportsSearchPath: false,
  });
}
