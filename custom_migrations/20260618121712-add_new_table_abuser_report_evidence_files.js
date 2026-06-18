export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "abuser_report_evidence_files",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      report_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "abuser_reports",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      file_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      file_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("abuser_report_evidence_files", ["report_id"], {
    name: "abuser_report_evidence_files_report_id_idx",
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("abuser_report_evidence_files", {
    supportsSearchPath: false,
  });
}
