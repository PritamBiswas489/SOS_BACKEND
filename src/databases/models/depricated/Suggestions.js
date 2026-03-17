export default function Suggestions(sequelize, DataTypes) {
  const Suggestions = sequelize.define(
    "Suggestions",
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
      typeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      suggestion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      levelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
       email: {
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
      tableName: "suggestions",
      timestamps: true,
    }
  );

  return Suggestions;
}
