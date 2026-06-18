export default function AbuserReportEvidenceFiles(sequelize, DataTypes) {
  const AbuserReportEvidenceFiles = sequelize.define(
    "AbuserReportEvidenceFiles",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      report_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "abuser_reports",
          key: "id",
        },
      },
      file_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      file_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "abuser_report_evidence_files",
      timestamps: false,
    }
  );

  return AbuserReportEvidenceFiles;
}
