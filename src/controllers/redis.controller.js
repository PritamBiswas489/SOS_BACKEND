import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import RedisService from "../services/redis.service.js";

export default class RedisController {
  static async clearCache(req, res) {
    const response = await RedisService.clearCache(req, res);
    return {
      status: 200,
      data: response,
      error: {},
      };
  }

  static async saveDemoData(req, res) {
    const response = await RedisService.saveRedisDemoData();
    return {
      status: 200,
      data: response,
      error: {},
    };
  }
  static async getDemoData(req, res) {
    const response = await RedisService.getRedisDemoData();
    return {
      status: 200,
      data: response,
      error: {},
    };
  }

}