export default function FeedbackCategory(sequelize, DataTypes) {
  const FeedbackCategory = sequelize.define(
    "FeedbackCategory",
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
      tableName: "feedback_category",
      timestamps: true,
    }
  );

  return FeedbackCategory;
}
