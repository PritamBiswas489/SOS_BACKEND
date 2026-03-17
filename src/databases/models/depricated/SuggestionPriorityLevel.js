export default function SuggestionPriorityLevel(sequelize, DataTypes) {
  const SuggestionPriorityLevel = sequelize.define(
    "suggestion_priority_level",
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
      tableName: "suggestion_priority_level",
      timestamps: true,
    }
  );

  return SuggestionPriorityLevel;
}
