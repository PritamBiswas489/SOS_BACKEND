export default function HeartRateRecords(sequelize, DataTypes) {
  const HeartRateRecords = sequelize.define(
    "HeartRateRecords",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      current_hr: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stress_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      stress_state: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      stress_level: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rmssd: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      hr_intensity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      hr_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rmssd_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      avg_hr: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "heart_rate_records",
      timestamps: false,
    }
  );

  return HeartRateRecords;
}
