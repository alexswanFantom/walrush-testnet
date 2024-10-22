import { createLogger, format, transports } from "winston";
import fs from "fs";

const { combine, timestamp, printf, colorize } = format;

class Logger {
  constructor() {
    this.logFilePath = "log/app.log";

    const customFormat = printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level}]: ${message}`;
    });

    this.logger = createLogger({
      level: "debug",
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        colorize(),
        customFormat
      ),
      transports: [new transports.File({ filename: this.logFilePath })],
      exceptionHandlers: [new transports.File({ filename: this.logFilePath })],
      rejectionHandlers: [new transports.File({ filename: this.logFilePath })],
    });
  }

  info(message) {
    this.logger.info(message);
  }

  warn(message) {
    this.logger.warn(message);
  }

  error(message) {
    this.logger.error(message);
  }

  debug(message) {
    this.logger.debug(message);
  }

  setLevel(level) {
    this.logger.level = level;
  }

  clear() {
    fs.truncate(this.logFilePath, 0, (error) => {
      if (error) {
        this.logger.error(`Failed to clear the log file: ${error.message}`);
      } else {
        this.logger.info("Log file cleared");
      }
    });
  }
}

export default new Logger();
