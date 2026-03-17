export default function SuggestionType(sequelize, DataTypes) {
  const SuggestionType = sequelize.define(
    "SuggestionType",
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
      tableName: "suggestion_type",
      timestamps: true,
    }
  );

  return SuggestionType;
}
