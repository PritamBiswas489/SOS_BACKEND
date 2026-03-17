export default function KycStatusWebhook(sequelize, DataTypes) {
  const KycStatusWebhook = sequelize.define(
    "KycStatusWebhook",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      // Common Fields
      applicantId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      inspectionId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      applicantType: {
        type: DataTypes.STRING,
        allowNull: true
      },
      correlationId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      levelName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      externalUserId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true
      },
      sandboxMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reviewStatus: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAtMs: {
        type: DataTypes.STRING, // keep as string for exact match to webhook
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Uncommon Fields (action-related)
      applicantActionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      externalApplicantActionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Review Result Fields
      reviewAnswer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reviewRejectType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rejectLabels: {
        type: DataTypes.ARRAY(DataTypes.STRING), // PostgreSQL
        allowNull: true,
      },
      buttonIds: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      // Optional raw payload for auditing/debugging
      rawPayload: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: "kyc_status_webhook",
      timestamps: true,
     
    }
  );

  return KycStatusWebhook;
}
