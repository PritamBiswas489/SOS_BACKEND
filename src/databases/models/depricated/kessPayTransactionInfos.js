export default function kessPayTransactionInfos(sequelize, DataTypes) {
  return sequelize.define(
    "kessPayTransactionInfos",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      transactionCurrency: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transactionAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },

      qr_code: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      callBack_data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      transaction_ref: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transaction_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending",
      },
      receiver_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      receiver_bank: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      receiver_bakong_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      receiver_acc_info: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      expenseCatId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },

      walletCurrency: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      amountInUserWalletCurrency: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      merchantName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      merchantCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_month: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      created_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      out_trade_no: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
       is_fixed_price:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      memo:{
        type: DataTypes.STRING,
        allowNull: true,
      }
    },
    {
      tableName: "kesspay_transaction_infos",
      timestamps: true,
    }
  );
}
