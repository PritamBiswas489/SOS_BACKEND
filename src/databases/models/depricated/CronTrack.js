export default function CronTrack(sequelize, DataTypes) {
  return sequelize.define(
    "CronTrack",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      cronName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastRunAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "cron_track",
      timestamps: true,
    }
  );
}
