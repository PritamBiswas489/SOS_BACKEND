export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "emergency_services",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      requestBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      locationName: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      latitude: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      placeId: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "approved"),
        allowNull: false,
        defaultValue: "pending",
      },
      phoneNumber: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
       serviceType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      location: {
        type: Sequelize.GEOGRAPHY("POINT", 4326),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addIndex("emergency_services", ["location"], {
    name: "idx_emergency_services_location",
    using: "GIST",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("emergency_services", ["serviceType"], {
    name: "idx_emergency_services_service_type",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("emergency_services", ["requestBy"], {
    name: "idx_emergency_services_request_by",
    supportsSearchPath: false,
  });

  await queryInterface.addIndex("emergency_services", ["serviceType", "status"], {
    name: "idx_emergency_services_service_type_status",
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex(
    "emergency_services",
    "idx_emergency_services_service_type_status",
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.removeIndex(
    "emergency_services",
    "idx_emergency_services_request_by",
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.removeIndex(
    "emergency_services",
    "idx_emergency_services_service_type",
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.removeIndex(
    "emergency_services",
    "idx_emergency_services_location",
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.dropTable("emergency_services", {
    supportsSearchPath: false,
  });
}
