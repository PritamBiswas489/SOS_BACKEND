export default function AppFeedbackAttachments(sequelize, DataTypes) {
  const AppFeedbackAttachments = sequelize.define(
    "app_feedback_attachments",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      feedback_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "app_feedback",
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
      tableName: "app_feedback_attachments",
      timestamps: false,
    }
  );

  return AppFeedbackAttachments;
}
