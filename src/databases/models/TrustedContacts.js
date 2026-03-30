export default function TrustedContacts(sequelize, DataTypes) {
  const TrustedContacts = sequelize.define(
    "TrustedContacts",
   {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      trusted_user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      nickname: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      relationship: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      priority_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pending",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "trusted_contacts",
      timestamps: false
    }
  );

  return TrustedContacts;
}
