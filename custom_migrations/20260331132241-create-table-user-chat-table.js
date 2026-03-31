export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "user_chats",
    {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      sender_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      recipient_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      room_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      media_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      media_type: {
        type: Sequelize.ENUM("image", "video", "audio", "document"),
        allowNull: true,
      },
      media_json: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      reply_to: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "user_chats",
          key: "id",
        },
      },
      status: {
        type: Sequelize.ENUM("sent", "delivered", "read"),
        defaultValue: "sent",
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
    },
  );

  // Add indexes
  await queryInterface.addIndex("user_chats", ["sender_id"], { name: "idx_user_chats_sender_id" });
  await queryInterface.addIndex("user_chats", ["recipient_id"], { name: "idx_user_chats_recipient_id" });
  await queryInterface.addIndex("user_chats", ["room_id"], { name: "idx_user_chats_room_id" });
  await queryInterface.addIndex("user_chats", ["created_at"], { name: "idx_user_chats_created_at" });
  await queryInterface.addIndex(
    "user_chats",
    ["sender_id", "recipient_id", "created_at"],
    { name: "idx_user_chats_sender_recipient_created" },
  );
  await queryInterface.addIndex("user_chats", ["room_id", "created_at"], { name: "idx_user_chats_room_created" });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex("user_chats", "idx_user_chats_sender_id");
  await queryInterface.removeIndex("user_chats", "idx_user_chats_recipient_id");
  await queryInterface.removeIndex("user_chats", "idx_user_chats_room_id");
  await queryInterface.removeIndex("user_chats", "idx_user_chats_created_at");
  await queryInterface.removeIndex(
    "user_chats",
    "idx_user_chats_sender_recipient_created",
  );
  await queryInterface.removeIndex("user_chats", "idx_user_chats_room_created");
  await queryInterface.dropTable("user_chats", {
    supportsSearchPath: false,
  });
}
