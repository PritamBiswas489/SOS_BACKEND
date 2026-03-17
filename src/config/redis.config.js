import "../config/environment.js";
import Redis from "ioredis";
const { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD, REDIS_DATABASE } = process.env;


const redisConfig = {
	port: REDIS_PORT, // Redis port
	host: REDIS_HOST, // Redis host
	family: 4, // 4 (IPv4) or 6 (IPv6)
	username: REDIS_USERNAME,
	password: REDIS_PASSWORD,
	db: REDIS_DATABASE,
};

const redisClient = new Redis(redisConfig);

export default redisClient;
