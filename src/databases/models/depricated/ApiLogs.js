export default function ApiLogs(sequelize, DataTypes) {
  const ApiLogs = sequelize.define(
    "ApiLogs",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true, 
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deviceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      routePath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ipCountry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ipRegion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ipCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ipIsp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ipLat: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ipLon: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ipTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "api_logs",
      timestamps: true, // createdAt, updatedAt
    }
  );

  return ApiLogs;
}
