export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "abuser_reports",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      abuser_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "abusers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      abuse_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      incident_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      incident_location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      witness_information: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      threat_level: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      history_of_violence: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      weapon_access: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      restraining_order: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addConstraint("abuser_reports", {
    fields: ["threat_level"],
    type: "check",
    name: "abuser_reports_threat_level_check",
    where: {
      threat_level: ["Low", "Medium", "High"],
    },
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("abuser_reports", ["user_id"], {
    name: "abuser_reports_user_id_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("abuser_reports", ["abuser_id"], {
    name: "abuser_reports_abuser_id_idx",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("abuser_reports", ["user_id", "abuser_id"], {
    name: "abuser_reports_user_id_abuser_id_idx",
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("abuser_reports", {
    supportsSearchPath: false,
  });
}
