export default function BugPlace(sequelize, DataTypes) {
  const BugPlace = sequelize.define(
    "bug_place",
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
      tableName: "bug_place",
      timestamps: true,
    }
  );

  return BugPlace;
}
