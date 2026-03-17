export default function NinePayTransactionInfos(sequelize, DataTypes) {
  return sequelize.define(
    "NinePayTransactionInfos",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      request_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      partner_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bank_no: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      account_no: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      account_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      account_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      request_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      transfer_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PENDING",
      },
      date_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      fee: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      extra_data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      callBack_data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      expenseCatId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "expensesCategories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      memo: {
        type: DataTypes.STRING,
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
      is_valid_transfer_signature: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      is_valid_callback_signature: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      qr_code: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_fixed_price:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    },
    {
      tableName: "ninepay_transaction_infos",
      timestamps: true,
    }
  );
}
