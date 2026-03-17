// scripts/create-migration.js
import fs from 'fs';
import path from 'path';

const name = process.argv[2];

if (!name) {
  console.error('❌ Please provide a migration name.');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
const filename = `${timestamp}-${name}.js`;
const filepath = path.join('custom_migrations', filename);

const content = `export async function up(queryInterface, Sequelize) {
  // TODO: create table
}

export async function down(queryInterface, Sequelize) {
  // TODO: drop table
}
`;

fs.writeFileSync(filepath, content);
console.log(`✅ Created: ${filepath}`);
