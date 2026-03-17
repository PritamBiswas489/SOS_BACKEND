export default function FavouriteQrCodes(sequelize, DataTypes) {
  const FavouriteQrCodes = sequelize.define(
    "favouriteQrCodes",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      qrCodeData: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "favourite_qr_codes",
      timestamps: true,
    }
  );
  return FavouriteQrCodes;
}
