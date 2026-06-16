import "./environment.js";

const dbConfig = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT,
    dialectOptions: {
      ssl: false, // ✅ force disable SSL
    },
    logging: false,
  },
};

export default dbConfig;
