export default function User(sequelize, DataTypes) {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      profile_photo: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      ngo_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      hex_salt: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM,
        values: ["ADMIN", "USER", "NGO"],
        allowNull: true,
        defaultValue: "USER",
      },
      ngo_certificate: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      ngo_number_of_user_assigned: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      ngo_number_of_user_registered: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      is_online: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      last_seen: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      first_time_login: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,  
      }
    },
    {
      tableName: "users",
      timestamps: false
    }
  );

  return User;
}
