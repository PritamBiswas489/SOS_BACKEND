export default function AbuserReports(sequelize, DataTypes) {
  const AbuserReports = sequelize.define(
    "AbuserReports",
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
      },
      abuser_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "abusers",
          key: "id",
        },
      },
      abuse_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      incident_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      incident_location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      witness_information: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      threat_level: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          isIn: [["Low", "Medium", "High"]],
        },
      },
      history_of_violence: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      weapon_access: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      restraining_order: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "abuser_reports",
      timestamps: false,
    }
  );

  return AbuserReports;
}
