export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "app_feedback",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      feedback_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      screenshot_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      app_version: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      device_info: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      os_version: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      allow_contact: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: "new",
      },
      admin_reply: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.addConstraint("app_feedback", {
    fields: ["rating"],
    type: "check",
    name: "app_feedback_rating_check",
    where: {
      rating: {
        [Sequelize.Op.between]: [1, 5],
      },
    },
    supportsSearchPath: false,
  });

  await queryInterface.addConstraint("app_feedback", {
    fields: ["status"],
    type: "check",
    name: "app_feedback_status_check",
    where: {
      status: ["new", "reviewed", "resolved", "ignored"],
    },
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("app_feedback", {
    supportsSearchPath: false,
  });
}
