export default function KesspayKyc(sequelize, DataTypes) {
  return sequelize.define(
    "KesspayKyc",
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
      userInfo: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      kessPayUserId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      kycStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "PENDING",
      },
      kycResponseData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: "kesspay_kyc",
      timestamps: true,
    }
  );
}
