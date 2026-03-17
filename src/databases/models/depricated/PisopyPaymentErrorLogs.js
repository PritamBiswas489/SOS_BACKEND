export default function PisopyPaymentErrorLogs(sequelize, DataTypes) {
  return sequelize.define(
    "PisopyPaymentErrorLogs",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "pisopy_payment_error_logs",
      timestamps: true,
    }
  );
}
