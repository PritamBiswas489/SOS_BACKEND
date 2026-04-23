export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("sos_session_audio_records", {
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
    file_name: {
      type: Sequelize.STRING(255),
      allowNull: false,
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
  await queryInterface.dropTable("sos_session_audio_records", {
    supportsSearchPath: false,
  });
}
