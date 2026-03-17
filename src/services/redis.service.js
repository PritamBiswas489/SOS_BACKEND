import redisClient from "../config/redis.config.js";
import RedisStore from "rate-limit-redis";
import "../config/environment.js";

export default class RedisService {
  //clear full redis cache
  static async clearCache(req, res) {
    try {
      await redisClient.flushall();
      return { success: true, message: "All Redis caches cleared." };
    } catch (error) {
      return {
        success: false,
        message: "Error clearing Redis cache.",
        error: error.message,
      };
    }
  }
  //for testing purpose only
  static async saveRedisDemoData() {
    const key = "usertest:1234";
    const value = { id: 1234, name: "John Doe", age: 30 };
    const expiration = 3600; // 1 hour in seconds
    try {
      await redisClient.set(key, JSON.stringify(value));
      if (expiration) {
        await redisClient.expire(key, expiration);
      }
      return {
        success: true,
        message: `Data saved: ${key}`,
        data: value,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error saving data to Redis.",
        error: error.message,
      };
    }
  }
  //for testing purpose only
  static async getRedisDemoData() {
    const key = "usertest:1234";
    try {
      const data = await redisClient.get(key);
      if (data) {
        return {
          success: true,
          message: `Data retrieved: ${key}`,
          data: JSON.parse(data),
        };
      } else {
        return {
          success: false,
          message: "No data found.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Error retrieving data from Redis.",
        error: error.message,
      };
    }
  }
}
