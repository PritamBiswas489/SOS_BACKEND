export default function BugSeverity(sequelize, DataTypes) {
  const BugSeverity = sequelize.define(
    "bug_severity",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      engText: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      heText: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "bug_severity",
      timestamps: true,
    }
  );

  return BugSeverity;
}
