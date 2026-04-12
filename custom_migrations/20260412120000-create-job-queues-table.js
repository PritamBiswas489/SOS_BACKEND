export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("job_queues", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    job_id: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    job_name: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    payloads: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    status: {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: "pending",
    },
    status_description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },{
    supportsSearchPath: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("job_queues",{
    supportsSearchPath: false
  });
}
