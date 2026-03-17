export default function Feedbacks(sequelize, DataTypes) {
  const Feedbacks = sequelize.define(
    "Feedbacks",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      comment: {
        type: DataTypes.STRING,
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
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: "feedbacks",
      timestamps: true,
    }
  );

  return Feedbacks;
}
