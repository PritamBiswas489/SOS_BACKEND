export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn(
    "sos_sessions",
    "latitude",
    {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: null,
    },
    {
      supportsSearchPath: false,
    }
  );

  await queryInterface.addColumn(
    "sos_sessions",
    "longitude",
    {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: null,
    },
    {
      supportsSearchPath: false,
    }
  );

  await queryInterface.addColumn(
    "sos_sessions",
    "location",
    {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    {
      supportsSearchPath: false,
    }
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("sos_sessions", "latitude", {
    supportsSearchPath: false,
  });

  await queryInterface.removeColumn("sos_sessions", "longitude", {
    supportsSearchPath: false,
  });

  await queryInterface.removeColumn("sos_sessions", "location", {
    supportsSearchPath: false,
  });
}
