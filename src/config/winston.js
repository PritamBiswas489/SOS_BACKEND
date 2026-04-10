import winston from "winston";
import "winston-daily-rotate-file";
import fs from "fs";
import os from "os";
import path from "path";

const logDirCandidates = [
  process.env.LOG_DIR,
  path.resolve(process.cwd(), "logs"),
  path.join(os.tmpdir(), "sos-backend-logs"),
].filter(Boolean);

const resolveWritableLogsDir = () => {
  for (const candidate of logDirCandidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true, mode: 0o755 });
      fs.accessSync(candidate, fs.constants.W_OK);
      return candidate;
    } catch {
      // Try next candidate when this path is not writable/accessible.
    }
  }

  return null;
};

const logsDir = resolveWritableLogsDir();

const customFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: logsDir
    ? [
        new winston.transports.DailyRotateFile({
          filename: path.join(logsDir, "error-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          level: "error",
          maxSize: "20m",
          maxFiles: "14d",
          zippedArchive: true,
        }),
      ]
    : [new winston.transports.Console({ level: "error" })],
});

export default logger;