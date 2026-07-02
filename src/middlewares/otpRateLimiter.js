import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.config.js";

const createOtpRateLimiter = ({ windowMs, max, keyPrefix, retryAfter, errorKey }) =>
  rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs,
    max,
    keyGenerator: (req) => `${keyPrefix}_${req.deviceid}`,
    handler: (req, res) => {
      const i18n = req.headers.i18n;
      console.log(
        `Rate limit exceeded for device ${req.deviceid}. IP: ${req.ip}`
      );
      res.set("Retry-After", retryAfter);
      res.return({
        status: 429,
        data: [],
        error: {
          message: i18n.__(errorKey),
        },
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

// --- Per-route limiters ---

export const otpRateLimiter = createOtpRateLimiter({
  windowMs: 90 * 1000,
  max: 3,
  keyPrefix: "otp_short",
  retryAfter: 60,
  errorKey: "TOO_MANY_OTP_REQUESTS",
});

export const feedbackApiRateLimiter = createOtpRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  keyPrefix: "feedback_api",
  retryAfter: 24 * 60 * 60,
  errorKey: "DAILY_API_LIMIT_EXCEEDED",
});

export const reportAbuserApiRateLimiter = createOtpRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  keyPrefix: "report_abuser_api",
  retryAfter: 24 * 60 * 60,
  errorKey: "DAILY_API_LIMIT_EXCEEDED",
});

export const contactAdminApiRateLimiter = createOtpRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  keyPrefix: "contact_admin_api",
  retryAfter: 24 * 60 * 60,
  errorKey: "DAILY_API_LIMIT_EXCEEDED",
});

