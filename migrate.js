// migrate.js
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // ✅ Needed for ESM imports
import db from './src/databases/models/index.js'; // your Sequelize instance
import { Sequelize } from 'sequelize'; // ✅ Required for DataTypes in migrations

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Umzug
const umzug = new Umzug({
  migrations: {
    glob: 'custom_migrations/*.js',
    cwd: __dirname,
    resolve: ({ name, path: migrationPath, context }) => {
      return {
        name,
        up: async () => {
          const mod = await import(pathToFileURL(migrationPath)); // ✅ FIX HERE
          return mod.up(context, Sequelize);
        },
        down: async () => {
          const mod = await import(pathToFileURL(migrationPath)); // ✅ FIX HERE
          return mod.down(context);
        },
      };
    },
  },
  context: db.sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: db.sequelize }),
  logger: console,
});

// CLI Command Handler
const command = process.argv[2];

try {
  if (command === 'up') {
    await umzug.up();
    console.log('✅ Migrations applied.');
  } else if (command === 'down') {
    await umzug.down();
    console.log('⛔ All migrations reverted.');
  } else if (command === 'reset') {
    await umzug.down({ to: 0 });
    console.log('⛔ All migrations reverted.');
  } else if (command === 'check') {
    const executed = await umzug.executed();
    console.log('Already executed migrations:', executed.map(m => m.name));
  } else {
    console.log(`❓ Unknown command: ${command}`);
    console.log('Usage: node migrate.js [up | down | reset | check]');
  }
} catch (error) {
  console.error('❌ Migration error:', error);
  process.exit(1);
}
