export default function ExpensesCategories(sequelize, DataTypes) {
  const ExpensesCategories = sequelize.define(
    "expensesCategories",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      icon: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hebrewTitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "expensesCategories",
      timestamps: true,
    }
  );
  return ExpensesCategories;
}
