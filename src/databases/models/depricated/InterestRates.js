export default function InterestRates(sequelize, DataTypes) {
  const InterestRates = sequelize.define(
    "InterestRates",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      paymentNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
         
      },
      interestRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        
      },
    },
    {
      tableName: "interest_rates",
      
      timestamps: true,
    }
  );

  return InterestRates;
}
