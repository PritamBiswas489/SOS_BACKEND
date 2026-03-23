export async function up(queryInterface, Sequelize) {
  // Create trigger function and trigger for ngo_number_of_user_registered
  // Add ngo_id column to users table
  await queryInterface.addColumn(
    "users",
    "ngo_id",
    {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    {
      supportsSearchPath: false,
    },
  );

  // Add ngo_number_of_user_registered column
  await queryInterface.addColumn(
    "users",
    "ngo_number_of_user_registered",
    {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    {
      supportsSearchPath: false,
    },
  );
  // Add ngo_number_of_user_assigned column
  await queryInterface.addColumn(
    "users",
    "ngo_number_of_user_assigned",
    {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    {
      supportsSearchPath: false,
    },
  );

  // Add index on ngo_id
  await queryInterface.addIndex("users", ["ngo_id"], {
    name: "users_ngo_id_idx",
    fields: ["ngo_id"],
    unique: false,
    supportsSearchPath: false,
  });

  // Add hex_salt column
  await queryInterface.addColumn(
    "users",
    "hex_salt",
    {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    {
      supportsSearchPath: false,
    },
  );

  // Add role column
  await queryInterface.addColumn(
    "users",
    "role",
    {
      type: Sequelize.ENUM("ADMIN", "USER", "NGO"),
      allowNull: true,
      defaultValue: "USER",
    },
    {
      supportsSearchPath: false,
    },
  );

  // Add ngo_certificate column
  await queryInterface.addColumn(
    "users",
    "ngo_certificate",
    {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    {
      supportsSearchPath: false,
    },
  );

  await queryInterface.sequelize.query(`
          CREATE OR REPLACE FUNCTION increment_ngo_user_registered()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.ngo_id IS NOT NULL THEN
              UPDATE users
              SET ngo_number_of_user_registered = COALESCE(ngo_number_of_user_registered, 0) + 1
              WHERE id = NEW.ngo_id;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trg_increment_ngo_user_registered
          AFTER INSERT ON users
          FOR EACH ROW
          EXECUTE FUNCTION increment_ngo_user_registered();
        `);
}

export async function down(queryInterface, Sequelize) {
  // Drop trigger and function for ngo_number_of_user_registered
  await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS trg_increment_ngo_user_registered ON users;
          DROP FUNCTION IF EXISTS increment_ngo_user_registered();
        `);
  // Remove ngo_number_of_user_registered column
  await queryInterface.removeColumn("users", "ngo_number_of_user_registered", {
    supportsSearchPath: false,
  });
  // Remove index on ngo_id
  await queryInterface.removeIndex("users", "users_ngo_id_idx", {
    supportsSearchPath: false,
  });

  // Remove ngo_number_of_user_assigned column
  await queryInterface.removeColumn("users", "ngo_number_of_user_assigned", {
    supportsSearchPath: false,
  });
  // Remove ngo_certificate column
  await queryInterface.removeColumn("users", "ngo_certificate", {
    supportsSearchPath: false,
  });

  // Remove role column
  await queryInterface.removeColumn("users", "role", {
    supportsSearchPath: false,
  });

  // Remove hex_salt column
  await queryInterface.removeColumn("users", "hex_salt", {
    supportsSearchPath: false,
  });

  // Remove ngo_id column from users table
  await queryInterface.removeColumn("users", "ngo_id", {
    supportsSearchPath: false,
  });
}
