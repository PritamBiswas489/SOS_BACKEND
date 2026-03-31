export default function UserChats(sequelize, DataTypes) {
  const UserChats = sequelize.define(
    "UserChats",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      sender_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      recipient_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      room_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      media_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      media_type: {
        type: DataTypes.ENUM("image", "video", "audio", "document"),
        allowNull: true,
      },
      media_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      reply_to: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "user_chats",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("sent", "delivered", "read"),
        defaultValue: "sent",
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
      tableName: "user_chats",
      timestamps: false,
    },
  );

  return UserChats;
}
