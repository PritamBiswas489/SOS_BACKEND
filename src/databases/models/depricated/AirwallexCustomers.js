export default function AirwallexCustomers(sequelize, DataTypes) {
  const AirwallexCustomers = sequelize.define(
    "AirwallexCustomers",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      airwallexCustomerId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "airwallex_customers",
      timestamps: true, // createdAt, updatedAt
    },
  );

  return AirwallexCustomers;
}
