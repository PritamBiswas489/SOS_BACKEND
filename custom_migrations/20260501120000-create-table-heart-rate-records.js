import { BIGINT } from "sequelize";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "heart_rate_records",
    {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      source: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      current_hr: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stress_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      stress_state: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      stress_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rmssd: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      hr_intensity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      hr_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rmssd_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      avg_hr: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      supportsSearchPath: false,
    }
  );

  // CHECK constraints
  await queryInterface.sequelize.query(`
    ALTER TABLE heart_rate_records
      ADD CONSTRAINT chk_heart_rate_source CHECK (source IN ('ble', 'googlefit')),
      ADD CONSTRAINT chk_heart_rate_stress_score CHECK (stress_score BETWEEN 0 AND 100),
      ADD CONSTRAINT chk_heart_rate_stress_level CHECK (stress_level BETWEEN -1 AND 4),
      ADD CONSTRAINT chk_heart_rate_hr_intensity CHECK (hr_intensity BETWEEN 0 AND 100);
  `);

  // Unique index on (user_id, id)
  await queryInterface.addIndex("heart_rate_records", ["user_id", "id"], {
    unique: true,
    name: "idx_user_id_id_unique",
  });

  // Index on (user_id, created_at DESC) — raw query for DESC ordering
  await queryInterface.sequelize.query(`
    CREATE INDEX idx_user_created_at_desc
    ON heart_rate_records(user_id, created_at DESC);
  `);

  // Index on (user_id, source)
  await queryInterface.addIndex("heart_rate_records", ["user_id", "source"], {
    name: "idx_user_source",
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("heart_rate_records", {
    supportsSearchPath: false,
  });
}
