import { privateKey } from "./app/accounts/accounts.js";
import { Config } from "./app/config/config.js";
import { COINENUM } from "./app/src/core/coin/coin_enum.js";
import Core from "./app/src/core/core.js";
import { Helper } from "./app/src/utils/helper.js";
import Logger from "./app/src/utils/logger.js";

const MIN_BALANCE = Config.TXAMOUNTMAX;
const SWAP_COUNT = Config.SWAPCOUNT;
const DELAY_HOURS = Config.DELAYINHOURS || 6;

async function performOperations(core) {
  await core.getAccountInfo();
  await core.getBalance(true);
  await core.requestFaucet();

  const hasNFT = await core.checkNFT();
  if (!hasNFT) {
    await core.mintNft();
  }

  const suiBalance =
    core.balance.find((coin) => coin.coinType === COINENUM.SUI)?.totalBalance ||
    0;

  if (suiBalance < MIN_BALANCE) {
    throw new Error(`Minimum balance required is ${MIN_BALANCE} SUI`);
  }

  for (let i = 0; i < SWAP_COUNT; i++) {
    try {
      await core.exSuiToWal();
      await core.exWalToSui();
      core.txCount++;
    } catch (error) {
      Logger.error(`Swap error: ${error.message}`);
    }
  }

  await core.exSuiToWal();
  await core.stakeWalToOperator();
}

async function operateAccount(privateKey) {
  const core = new Core(privateKey);
  try {
    await performOperations(core);

    const delayMs = 3600000 * DELAY_HOURS;
    const accountIndex = privateKeys.indexOf(privateKey) + 1;

    await Helper.delay(
      delayMs,
      privateKey,
      `Account ${accountIndex} Processing Done, Delaying for ${Helper.msToTime(
        delayMs
      )}`,
      core
    );

    await operateAccount(privateKey);
  } catch (error) {
    const errorMessage = error.message || JSON.stringify(error);
    await Helper.delay(
      10000,
      privateKey,
      `Error: ${errorMessage}, Retrying in 10 seconds`,
      core
    );
    await operateAccount(privateKey);
  }
}

async function startBot() {
  try {
    Logger.info("BOT STARTED");
    if (privateKey.length === 0) {
      throw new Error(
        "Please input your account first in the accounts.js file"
      );
    }
    await Promise.all(privateKey.map(operateAccount));
  } catch (error) {
    Logger.info("BOT STOPPED");
    Logger.error(JSON.stringify(error));
    throw error;
  }
}

(async () => {
  try {
    Logger.clear();
    Logger.info("Application Started");
    Helper.showLogo();

    if (privateKey.length < 1) {
      throw new Error("Please set up accounts.js first");
    }

    await startBot();
  } catch (error) {
    console.error("Error during bot execution:", error);
    throw error;
  }
})();
