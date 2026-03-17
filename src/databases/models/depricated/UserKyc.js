export default function UserKyc(sequelize, DataTypes) {
  return sequelize.define(
    "UserKyc",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      applicantId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nationalId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      kycData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "Document_pending",
      },
    },
    {
      tableName: "user_kyc",
      timestamps: true,
    }
  );
}
