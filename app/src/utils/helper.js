import bip39 from "bip39";
import twist from "./twist.js";
import moment from "moment-timezone";
import { Config } from "../../config/config.js";

export class Helper {
  static display = Config.DISPLAY;

  static delay(duration, taskId, taskName, extraInfo) {
    return new Promise((resolve) => {
      let remainingTime = duration;

      const logDelay = (time) => {
        const message = `Delaying for ${this.msToTime(time)}`;
        if (taskId !== undefined) {
          twist.log(taskName, taskId, extraInfo, message);
        } else {
          twist.info(message);
        }
      };

      logDelay(remainingTime);

      const intervalId = setInterval(() => {
        remainingTime -= 1000;
        logDelay(remainingTime);

        if (remainingTime <= 0) {
          clearInterval(intervalId);
          resolve();
        }
      }, 1000);

      setTimeout(async () => {
        clearInterval(intervalId);
        await twist.clearInfo();
        if (taskId) {
          twist.log(taskName, taskId, extraInfo);
        }
        resolve();
      }, duration);
    });
  }

  static randomUserAgent() {
    const userAgents = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/125.2535.60 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; VOG-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
      "Mozilla/5.0 (Linux; Android 10; SM-N975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  static readTime(timestamp) {
    return moment.unix(timestamp).format("YYYY-MM-DD HH:mm:ss");
  }

  static getCurrentTimestamp() {
    return moment().tz("Asia/Singapore").unix().toString();
  }

  static random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomFloat(min, max, decimals = 4) {
    const randomNumber = Math.random() * (max - min) + min;
    return parseFloat(randomNumber.toFixed(decimals));
  }

  static msToTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const remainingMilliseconds = milliseconds % 3600000;
    const minutes = Math.floor(remainingMilliseconds / 60000);
    const seconds = Math.round((remainingMilliseconds % 60000) / 1000);
    return `${hours} Hours ${minutes} Minutes ${seconds} Seconds`;
  }

  static generateRandomString(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  static serializeBigInt = (obj) => {
    return JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  };

  static isMnemonic(phrase) {
    return bip39.validateMnemonic(phrase);
  }

  static isPrivateKey(key) {
    const cleanKey = key.replace(/^0x/, "");
    const privateKeyRegex = /^[a-fA-F0-9]{64}$/;
    return privateKeyRegex.test(cleanKey);
  }

  static determineType(input) {
    if (this.isMnemonic(input)) {
      return "Secret Phrase";
    } else {
      return this.isPrivateKey(input) ? "Private Key" : "Unknown";
    }
  }

  static isToday(date) {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(inputDate);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  }

  static showLogo() {
    class ConsoleColors {
      static RED = "\x1b[31m";
      static GREEN = "\x1b[32m";
      static WHITE = "\x1b[37m";
      static BLACK = "\x1b[30m";
      static RESET = "\x1b[0m"; // Reset to default color
      static boldStart = "\x1b[1m";
    }

    console.log(
      `
   █████████   █████ ███████████   ██████████   ███████████      ███████    ███████████       █████████    █████████    █████████
  ███░░░░░███ ░░███ ░░███░░░░░███ ░░███░░░░███ ░░███░░░░░███   ███░░░░░███ ░░███░░░░░███     ███░░░░░███  ███░░░░░███  ███░░░░░███
 ░███    ░███  ░███  ░███    ░███  ░███   ░░███ ░███    ░███  ███     ░░███ ░███    ░███    ░███    ░███ ░███    ░░░  ███     ░░░
 ░███████████  ░███  ░██████████   ░███    ░███ ░██████████  ░███      ░███ ░██████████     ░███████████ ░░█████████ ░███         
 ░███░░░░░███  ░███  ░███░░░░░███  ░███    ░███ ░███░░░░░███ ░███      ░███ ░███░░░░░░      ░███░░░░░███  ░░░░░░░░███░███         
 ░███    ░███  ░███  ░███    ░███  ░███    ███  ░███    ░███ ░░███     ███  ░███            ░███    ░███  ███    ░███░░███     ███
 █████   █████ █████ █████   █████ ██████████   █████   █████ ░░░███████░   █████           █████   █████░░█████████  ░░█████████
 ░░░░░   ░░░░░ ░░░░░ ░░░░░   ░░░░░ ░░░░░░░░░░   ░░░░░   ░░░░░    ░░░░░░░    ░░░░░           ░░░░░   ░░░░░  ░░░░░░░░░    ░░░░░░░░░  
`
    );
    console.log(`${ConsoleColors.boldStart}┌                                             ┐${ConsoleColors.RESET}
    ${ConsoleColors.BLACK}BOT              : ${ConsoleColors.GREEN}WALRUS TESTNET BOT 
    ${ConsoleColors.BLACK}Telegram Channel : ${ConsoleColors.GREEN}@airdropasc               
    ${ConsoleColors.BLACK}Telegram Group   : ${ConsoleColors.GREEN}@autosultan_group${ConsoleColors.RESET}         
${ConsoleColors.boldStart}└                                             ┘${ConsoleColors.RESET}`);

    console.log(` `);
    console.log(` `);
  }
}
