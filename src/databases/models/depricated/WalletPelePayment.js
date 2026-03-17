export default function WalletPelePayment(sequelize, DataTypes) {
  const WalletPelePayment = sequelize.define(
    "WalletPelePayment",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: DataTypes.BIGINT,
      StatusCode: DataTypes.STRING,
      EnStatusMessage: DataTypes.STRING,
      HeStatusMessage: DataTypes.STRING,

      PelecardTransactionId: DataTypes.STRING,
      VoucherId: DataTypes.STRING,
      ShvaResult: DataTypes.STRING,
      ShvaResultEmv: DataTypes.STRING,
      ShvaResultEmvMessage: DataTypes.STRING,
      ShvaFileNumber: DataTypes.STRING,
      StationNumber: DataTypes.STRING,
      Reciept: DataTypes.STRING,
      JParam: DataTypes.STRING,
      CreditCardNumber: DataTypes.STRING,
      CreditCardExpDate: DataTypes.STRING,
      CreditCardCompanyClearer: DataTypes.STRING,
      CreditCardCompanyIssuer: DataTypes.STRING,
      CreditCardStarsDiscountTotal: DataTypes.STRING,
      CreditType: DataTypes.STRING,
      CreditCardAbroadCard: DataTypes.STRING,
      DebitType: DataTypes.STRING,
      DebitCode: DataTypes.STRING,
      DebitTotal: DataTypes.INTEGER,
      DebitApproveNumber: DataTypes.STRING,
      DebitCurrency: DataTypes.STRING,
      TotalPayments: DataTypes.INTEGER,
      FirstPaymentTotal: DataTypes.INTEGER,
      FixedPaymentTotal: DataTypes.INTEGER,
      AdditionalDetailsParamX: DataTypes.STRING,
      shvaOutput: DataTypes.TEXT,
      CardHebName: DataTypes.STRING,
      CreditCardBrand: DataTypes.STRING,
      ApprovedBy: DataTypes.STRING,
      CallReason: DataTypes.STRING,
      Token: DataTypes.STRING,
      Tz: DataTypes.STRING,
      Uid: DataTypes.STRING,
      eci: DataTypes.STRING,
      xid: DataTypes.STRING,
      cavv: DataTypes.STRING,
      Terminal: DataTypes.STRING,
      TerminalName: DataTypes.STRING,
      AppVersion: DataTypes.STRING,
      compRetailerNum: DataTypes.STRING,
      dateTime: DataTypes.STRING,
      RRN: DataTypes.STRING,
      Atc: DataTypes.STRING,
      TSI: DataTypes.STRING,
      ARC: DataTypes.STRING,
      TVR: DataTypes.STRING,
      AID: DataTypes.STRING,
      interestRate: {
        type: DataTypes.DECIMAL(5, 2), // e.g., 12.50%
        allowNull: true,
        defaultValue: null,
      },
      latitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "wallet_pele_payments",
      timestamps: true, // Enables createdAt and updatedAt
    }
  );

  return WalletPelePayment;
}
