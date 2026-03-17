export default function kycVerifiedDocuments(sequelize, DataTypes) {
  return sequelize.define(
    "kycVerifiedDocuments",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      applicantId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      inspectionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      documentData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      documentFiles: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      kessPaySenderId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "kyc_verified_documents",
      timestamps: true,
    }
  );
}
