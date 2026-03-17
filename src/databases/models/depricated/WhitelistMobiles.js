export default function WhitelistMobiles(sequelize, DataTypes) {
  return sequelize.define(
    "WhitelistMobiles",
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
      displayName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mobileNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      formattedNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hasThumbnail: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      thumbnailPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "whitelist_mobiles",
      timestamps: true,
    }
  );
}
