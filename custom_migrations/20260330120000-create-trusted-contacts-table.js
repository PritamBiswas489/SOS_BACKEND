
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("trusted_contacts", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    trusted_user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    nickname: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    relationship: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    priority_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },{
    supportsSearchPath: false
  });
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("trusted_contacts",{
    supportsSearchPath: false
  });
}
