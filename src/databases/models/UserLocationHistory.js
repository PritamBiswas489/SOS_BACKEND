export default function UserLocationHistory(sequelize, DataTypes) {
  const UserLocationHistory = sequelize.define(
    "UserLocationHistory",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      roomId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      altitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      accuracy: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      heading: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      speed: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      isBackground: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "user_location_history",
      timestamps: false,
    }
  );
  return UserLocationHistory;
}
