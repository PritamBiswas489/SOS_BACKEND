export default function UserContactList(sequelize, DataTypes) {
  const UserContactList = sequelize.define(
    "UserContactList",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      contactHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "user_contact_list",
      timestamps: true,
    }
  );
  return UserContactList;
}
