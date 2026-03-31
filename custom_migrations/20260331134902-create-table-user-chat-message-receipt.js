export async function up(queryInterface, Sequelize) {
  // TODO: create table
  await queryInterface.createTable(
    "user_chat_message_receipts",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      message_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "user_chats", key: "id" },
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("delivered", "read"),
        allowNull: false,
        defaultValue: "delivered",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      supportsSearchPath: false,
    }
  );

  // Add indexes
  await queryInterface.addIndex("user_chat_message_receipts", ["message_id", "user_id"], { name: "idx_ucmr_message_user" });
  await queryInterface.addIndex("user_chat_message_receipts", ["user_id"], { name: "idx_ucmr_user_id" });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex("user_chat_message_receipts", "idx_ucmr_message_user");
  await queryInterface.removeIndex("user_chat_message_receipts", "idx_ucmr_user_id");
  await queryInterface.dropTable("user_chat_message_receipts", {
    supportsSearchPath: false,
  });
}
