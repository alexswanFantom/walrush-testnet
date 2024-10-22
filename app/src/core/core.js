import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import {
  FaucetRateLimitError,
  getFaucetHost,
  requestSuiFromFaucetV0,
} from "@mysten/sui/faucet";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Helper } from "../utils/helper.js";
import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { RPC } from "./network/rpc.js";
import { Config } from "../../config/config.js";
import { COINENUM } from "./coin/coin_enum.js";
import logger from "../utils/logger.js";

export default class Core {
  constructor(privateKey) {
    this.acc = privateKey;
    this.txCount = 0;
    this.client = new SuiClient({ url: getFullnodeUrl("testnet") });
    this.walrusAddress =
      "0x9f992cc2430a1f442ca7a5ca7638169f5d5c00e0ebc3977a65e9ac6e497fe5ef";
    this.walrusExchangeObjectId =
      "0x0e60a946a527902c90bbc71240435728cd6dc26b9e8debc69f09b71671c3029b";
    this.walrusPoolObjectId =
      "0x37c0e4d7b36a2f64d51bba262a1791f844cfd88f31379f1b7c04244061d43914";
    this.flatLanderNFT =
      "0x4cb65566af16acb9ae48c437e99653e77c06c1b712329486987223ca99f44575";
    this.randomObjectId =
      "0x0000000000000000000000000000000000000000000000000000000000000008";
  }

  async getAccountInfo() {
    try {
      await Helper.delay(500, this.acc, "Getting Account Information...", this);
      const decodedPrivateKey = decodeSuiPrivateKey(this.acc);
      this.wallet = Ed25519Keypair.fromSecretKey(decodedPrivateKey.secretKey);
      this.address = this.wallet.getPublicKey().toSuiAddress();
      await Helper.delay(
        1000,
        this.acc,
        "Successfully Get Account Information",
        this
      );
    } catch (error) {
      throw error;
    }
  }

  async requestFaucet() {
    try {
      await Helper.delay(500, this.acc, "Requesting Sui Faucet", this);
      await requestSuiFromFaucetV0({
        host: getFaucetHost("testnet"),
        recipient: this.address,
      });
      await Helper.delay(
        1000,
        this.acc,
        "Sui Faucet Requested Successfully",
        this
      );
      await this.getBalance();
    } catch (error) {
      if (error instanceof FaucetRateLimitError) {
        await Helper.delay(2000, this.acc, error.message, this);
      } else {
        throw error;
      }
    }
  }

  async getTransactionDetail() {
    try {
      // Implementation here
    } catch (error) {
      throw error;
    }
  }

  async transferCoin() {
    try {
      await Helper.delay(500, this.acc, "Try To Transfer Sui", this);
      const amount =
        Number(Helper.random(Config.TXAMOUNTMIN, Config.TXAMOUNTMAX)) *
        Number(MIST_PER_SUI);
      const transaction = new Transaction();
      const coinToTransfer = transaction.splitCoins(transaction.gas, [amount]);
      transaction.transferObjects(
        [coinToTransfer],
        "0xc17539c8caaee52123447a81c0f591e91f068d36a334ceb231463cd8b5053557"
      );
      await this.executeTx(transaction);
    } catch (error) {
      throw error;
    }
  }

  async mergeCoin() {
    try {
      await Helper.delay(500, this.acc, "Merging Coin", this);
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType: COINENUM.WAL,
      });
      if (!coins.data || coins.data.length < 2) {
        await Helper.delay(1000, this.acc, "No Need to Merge Coin", this);
        return;
      }
      const transaction = new Transaction();
      const primaryCoin = coins.data[0].coinObjectId;
      const coinsToMerge = coins.data.slice(1).map((coin) => coin.coinObjectId);
      await Helper.delay(
        1000,
        this.acc,
        `Merging ${coinsToMerge.length} of ${COINENUM.WAL} Object`,
        this
      );
      await transaction.mergeCoins(
        transaction.object(primaryCoin),
        coinsToMerge.map((coinId) => transaction.object(coinId))
      );
      await this.executeTx(transaction);
    } catch (error) {
      throw error;
    }
  }

  async checkNFT() {
    try {
      await Helper.delay(500, this.acc, "Checking User NFT", this);
      const ownedObjects = await this.client.getOwnedObjects({
        owner: this.address,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const flatlanderNFTs = ownedObjects.data.filter((object) => {
        return object.data.type == COINENUM.FLATLANDERNFT;
      });
      if (flatlanderNFTs.length !== 0) {
        await Helper.delay(
          2000,
          this.acc,
          `You Already Have ${flatlanderNFTs.length} of ${COINENUM.FLATLANDERNFT}`,
          this
        );
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async mintNft() {
    try {
      await Helper.delay(
        3000,
        this.acc,
        `Minting ${COINENUM.FLATLANDERNFT} NFT`,
        this
      );
      const randomObject = await this.client.getObject({
        id: this.randomObjectId,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const transaction = new Transaction();
      const sharedObject = transaction.sharedObjectRef({
        objectId: randomObject.data.objectId,
        initialSharedVersion:
          randomObject.data.owner.Shared.initial_shared_version,
        mutable: false,
      });
      await transaction.moveCall({
        target: `${this.flatLanderNFT}::flatland::mint`,
        arguments: [sharedObject],
      });
      await this.executeTx(transaction);
    } catch (error) {
      await Helper.delay(
        3000,
        this.acc,
        error.message ?? "Failed to Mint NFT",
        this
      );
    }
  }

  async exWalToSui() {
    try {
      await this.mergeCoin();
      await Helper.delay(
        1000,
        this.acc,
        "Try To Exchange Back Wal to Sui",
        this
      );
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType: COINENUM.WAL,
      });
      const coin = coins.data[0];
      const balance = coin.balance;
      const exchangeObject = await this.client.getObject({
        id: this.walrusExchangeObjectId,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const transaction = new Transaction();
      const sharedObject = transaction.sharedObjectRef({
        objectId: exchangeObject.data.objectId,
        initialSharedVersion:
          exchangeObject.data.owner.Shared.initial_shared_version,
        mutable: true,
      });
      const coinToExchange = await transaction.splitCoins(
        transaction.object(coin.coinObjectId),
        [balance]
      );
      const exchangedCoin = transaction.moveCall({
        target: `${this.walrusAddress}::wal_exchange::exchange_all_for_sui`,
        arguments: [sharedObject, transaction.object(coinToExchange)],
      });
      await transaction.transferObjects([exchangedCoin], this.address);
      await this.executeTx(transaction);
    } catch (error) {
      throw error;
    }
  }

  async stakeWalToOperator() {
    try {
      await this.mergeCoin();
      await Helper.delay(1000, this.acc, "Try To Stake Wal to Operator", this);
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType: COINENUM.WAL,
      });
      const coin = coins.data[0];
      const balance = coin.balance;
      const poolObject = await this.client.getObject({
        id: this.walrusPoolObjectId,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const operatorObject = await this.client.getObject({
        id: Config.STAKENODEOPERATOR,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const transaction = new Transaction();
      const sharedPoolObject = transaction.sharedObjectRef({
        objectId: poolObject.data.objectId,
        initialSharedVersion:
          poolObject.data.owner.Shared.initial_shared_version,
        mutable: true,
      });
      const coinToStake = await transaction.splitCoins(
        transaction.object(coin.coinObjectId),
        [balance]
      );
      const stakedCoin = transaction.moveCall({
        target: `${this.walrusAddress}::staking::stake_with_pool`,
        arguments: [
          sharedPoolObject,
          transaction.object(coinToStake),
          transaction.object(operatorObject.data.objectId),
        ],
      });
      await transaction.transferObjects([stakedCoin], this.address);
      await this.executeTx(transaction);
    } catch (error) {
      if (error.message && error.message.includes("equivocated")) {
        await Helper.delay(1000, this.acc, error.message, this);
      }
      throw error;
    }
  }

  async exSuiToWal() {
    try {
      await Helper.delay(1000, this.acc, "Try To Exchange Sui to Wal", this);
      const amount =
        Number(Helper.randomFloat(Config.TXAMOUNTMIN, Config.TXAMOUNTMAX)) *
        Number(MIST_PER_SUI);
      const exchangeObject = await this.client.getObject({
        id: this.walrusExchangeObjectId,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const transaction = new Transaction();
      const sharedObject = transaction.sharedObjectRef({
        objectId: exchangeObject.data.objectId,
        initialSharedVersion:
          exchangeObject.data.owner.Shared.initial_shared_version,
        mutable: true,
      });
      const coinToExchange = await transaction.splitCoins(transaction.gas, [
        amount,
      ]);
      const exchangedCoin = transaction.moveCall({
        target: `${this.walrusAddress}::wal_exchange::exchange_all_for_wal`,
        arguments: [sharedObject, transaction.object(coinToExchange)],
      });
      await transaction.transferObjects([exchangedCoin], this.address);
      await this.executeTx(transaction);
    } catch (error) {
      throw error;
    }
  }

  async getBalance(showLogs = false) {
    try {
      if (showLogs) {
        await Helper.delay(500, this.acc, "Getting Account Balance...", this);
      }
      this.balance = await this.client.getAllBalances({
        owner: this.address,
      });
      this.balance = this.balance.map((balance) => {
        balance.totalBalance = parseFloat(
          (Number(balance.totalBalance) / Number(MIST_PER_SUI)).toFixed(2)
        );
        return balance;
      });
      if (showLogs) {
        await Helper.delay(
          1000,
          this.acc,
          "Successfully Get Account Balance",
          this
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async executeTx(transaction) {
    try {
      await Helper.delay(1000, this.acc, "Executing Tx ...", this);
      logger.info(await transaction.toJSON());
      const result = await this.client.signAndExecuteTransaction({
        signer: this.wallet,
        transaction: transaction,
      });
      await Helper.delay(
        3000,
        this.acc,
        `Tx Executed : ${result.digest}`,
        this
      );
      await this.getBalance();
    } catch (error) {
      throw error;
    }
  }
}
