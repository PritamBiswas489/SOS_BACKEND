import moment from "moment-timezone";
import "../../config/environment.js";
export default function BankhapoalimExchangeRate(sequelize, DataTypes) {
  const BankhapoalimExchangeRate = sequelize.define(
    "BankhapoalimExchangeRate",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      
    },
    {
      tableName: "bank_hapoalim_exchange_rates",
      timestamps: true,
    }
  );

   BankhapoalimExchangeRate.prototype.toJSON = function () {
      const values = { ...this.get() };
  
      if (values.createdAt) {
        values.createdAt = moment.utc(values.createdAt).tz(process.env.TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
      }
  
      if (values.updatedAt) {
        values.updatedAt = moment.utc(values.updatedAt).tz(process.env.TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
      }
  
      
      
  
      return values;
  };

  return BankhapoalimExchangeRate;
}
