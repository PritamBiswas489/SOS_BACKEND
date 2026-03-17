export default function BugReports(sequelize, DataTypes) {
  const BugReports = sequelize.define(
    "BugReports",
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
      severityId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      placeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bugDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      bugReproduce: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deviceInformation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attachment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "new",
      },
    },
    {
      tableName: "bug_reports",
      timestamps: true,
    }
  );
    return BugReports;
}
