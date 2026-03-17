export default function UserCard(sequelize, DataTypes)   {
  return  sequelize.define(
    "UserCard",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      cardHolderName: { type: DataTypes.STRING, allowNull: true },
      nationalId: { type: DataTypes.STRING, allowNull: true },
      VoucherId: { type: DataTypes.STRING, allowNull: true },
      ShvaResult: { type: DataTypes.STRING, allowNull: true },
      ShvaResultEmv: { type: DataTypes.STRING, allowNull: true },
      ShvaFileNumber: { type: DataTypes.STRING, allowNull: true },
      StationNumber: { type: DataTypes.STRING, allowNull: true },
      Reciept: { type: DataTypes.STRING, allowNull: true },
      JParam: { type: DataTypes.STRING, allowNull: true },
      CreditCardNumber: { type: DataTypes.STRING, allowNull: true },
      CreditCardExpDate: { type: DataTypes.STRING, allowNull: true },
      CreditCardCompanyClearer: { type: DataTypes.STRING, allowNull: true },
      CreditCardCompanyIssuer: { type: DataTypes.STRING, allowNull: true },
      CreditCardStarsDiscountTotal: { type: DataTypes.STRING, allowNull: true },
      CreditType: { type: DataTypes.STRING, allowNull: true },
      CreditCardAbroadCard: { type: DataTypes.STRING, allowNull: true },
      DebitType: { type: DataTypes.STRING, allowNull: true },
      DebitCode: { type: DataTypes.STRING, allowNull: true },
      DebitTotal: { type: DataTypes.STRING, allowNull: true },
      DebitApproveNumber: { type: DataTypes.STRING, allowNull: true },
      DebitCurrency: { type: DataTypes.STRING, allowNull: true },
      TotalPayments: { type: DataTypes.STRING, allowNull: true },
      FirstPaymentTotal: { type: DataTypes.STRING, allowNull: true },
      FixedPaymentTotal: { type: DataTypes.STRING, allowNull: true },
      AdditionalDetailsParamX: { type: DataTypes.STRING, allowNull: true },
      shvaOutput: { type: DataTypes.TEXT, allowNull: true },
      CardHebName: { type: DataTypes.STRING, allowNull: true },
      CreditCardBrand: { type: DataTypes.STRING, allowNull: true },
      ApprovedBy: { type: DataTypes.STRING, allowNull: true },
      CallReason: { type: DataTypes.STRING, allowNull: true },
      Token: { type: DataTypes.STRING, allowNull: true },

      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "user_cards",
      timestamps: true,
    }
  );

  
};
