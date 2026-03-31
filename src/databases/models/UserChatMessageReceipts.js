export default function UserChatMessageReceipts(sequelize, DataTypes) {
  const UserChatMessageReceipts = sequelize.define(
    "UserChatMessageReceipts",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      message_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "user_chats",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("delivered", "read"),
        allowNull: false,
        defaultValue: "delivered",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "user_chat_message_receipts",
      timestamps: false,
    },
  );

  return UserChatMessageReceipts;
}
