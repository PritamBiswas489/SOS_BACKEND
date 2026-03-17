export default function BankTransferTransactions(sequelize, DataTypes) {
  return sequelize.define(
    "BankTransferTransactions",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      postData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      paymentLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      webhookData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      webhookUser: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookPaymentRequest: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookPsuId: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookPaymentMethod: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookRequestedAmount: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookFinalAmount: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookAspspCode: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookAccountNumber: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookPsuMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookReferenceNumber: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookContext: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookTransferType: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookAccountType: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookCorporateId: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookCurrentStatus: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookPreviousStatus: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookTpp: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      tableName: "bank_transfer_transactions",
      timestamps: true,
    },
  );
}
