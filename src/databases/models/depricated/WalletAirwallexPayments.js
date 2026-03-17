export default function WalletAirwallexPayments(sequelize, DataTypes) {
  return sequelize.define(
    "WalletAirwallexPayments",
    {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    merchantOrderId: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: true,
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    capturedAmount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: true,
    },
    descriptor: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    paymentId: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    originalAmount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: true,
    },
    originalCurrency: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    webhookData: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "INITIATED",
    },
    latitude: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    longitude: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    },
    {
      tableName: "wallet_airwallex_payments",
      timestamps: true,
    },
  );
}
