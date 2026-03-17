export default function UserWallet(sequelize, DataTypes) {
  const UserWallet = sequelize.define(
    "UserWallet",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      balance: {
        type: DataTypes.DECIMAL(15, 2),  
        allowNull: false,
        defaultValue: 0.0,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "ILS", // Default to Israeli Shekel
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "active",
      },
      locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
     
    },
    {
      tableName: "user_wallets",
      timestamps: true, // since you're manually managing timestamps
    }
  );
  return UserWallet;
}
