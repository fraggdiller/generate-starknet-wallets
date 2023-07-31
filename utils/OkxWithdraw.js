// OkxWithdraw.js
import { OKXAuth, OKXWithdrawOptions } from '../config.js';
import { checkBalance, sleep } from "./helpers.js";
import { abi, ethcontract, rpc } from "./constants.js";
import ccxt from "ccxt";

class ErrorHandler {
    static handleCcxtError(e) {
        const errorType = e.constructor.name;
        console.error(`An error occurred ${errorType}.`);
        console.error(`Error details ${e}.`);
    }
}

class ExchangeFactory {
    static create() {
        const exchange_options = {
            'apiKey': OKXAuth.okx_apiKey,
            'secret': OKXAuth.okx_apiSecret,
            'password': OKXAuth.okx_apiPassword,
            'enableRateLimit': true,
        };

        const exchange = new ccxt.okx(exchange_options);

        if (OKXAuth.use_okx_proxy) {
            exchange.https_proxy = OKXAuth.okx_proxy
        }

        return exchange;
    }
}

class BalanceUpdater {
    static async updateBalance(address) {
        const balance_cache = 0;
        let balance;
        while (true) {
            try {
                balance = await checkBalance(rpc, address, ethcontract, abi)
            } catch (error) {
                await sleep(20);
                continue;
            }
            await sleep(20);
            if (balance > balance_cache) {
                console.log(`Deposit to ${address} successfully confirmed`)
                break
            }
        }
    }
}

export class FeeGetter {
    constructor(exchange, withdrawOptions) {
        this.exchange = exchange;
        this.withdrawOptions = withdrawOptions;
    }

    async getWithdrawFee() {
        try {
            const fees = await this.exchange.fetchDepositWithdrawFees([this.withdrawOptions.symbolWithdraw]);
            const feeInfo = fees[this.withdrawOptions.symbolWithdraw]?.networks?.[this.withdrawOptions.network];

            if (feeInfo) {
                return feeInfo.withdraw.fee;
            } else {
                console.error(`Failed to get withdrawal fees for ${this.withdrawOptions.symbolWithdraw} in ${this.withdrawOptions.network} network.`);
                const withdrawFee = Math.random() * (OKXWithdrawOptions.withdraw_fee[1] - OKXWithdrawOptions.withdraw_fee[0]) + OKXWithdrawOptions.withdraw_fee[0];
                console.error(`Using default withdrawal fees - ${withdrawFee.toFixed(4)} ${this.withdrawOptions.symbolWithdraw} in ${this.withdrawOptions.network} network.`);
                return withdrawFee;
            }
        } catch (error) {
            console.error("An error to get withdrawal fees:");
            ErrorHandler.handleCcxtError(error);
        }
    }
}

class OkxWithdraw {
    constructor(exchange, withdrawOptions, privateKey) {
        this.exchange = exchange;
        this.withdrawOptions = withdrawOptions;
        this.amount = (Math.random() * (OKXWithdrawOptions.amount[1] - OKXWithdrawOptions.amount[0]) + OKXWithdrawOptions.amount[0]).toFixed(5);
        this.privateKey = privateKey;
    }

    async execute(address) {
        try {
            const chainName = this.withdrawOptions.symbolWithdraw + '-' + this.withdrawOptions.network;
            const feeGetter = new FeeGetter(this.exchange, this.withdrawOptions);
            const withdrawFee = await feeGetter.getWithdrawFee();
            this.amount = (parseFloat(this.amount) + withdrawFee).toFixed(5);

            console.log(`[OKX] Withdrawing ${this.amount} ${this.withdrawOptions.symbolWithdraw} to ${address} in ${chainName} network`);
            await this.exchange.withdraw(this.withdrawOptions.symbolWithdraw, this.amount, address, {
                toAddress: address,
                chainName: chainName,
                dest: 4,
                fee: withdrawFee,
                pwd: '-',
                amt: this.amount,
                network: this.withdrawOptions.network
            });
            console.log(`[OKX] Withdrew out ${this.amount} ${this.withdrawOptions.symbolWithdraw} to ${address}`);
            console.log(`[OKX] Start waiting for deposit.`)
            await BalanceUpdater.updateBalance(address);

        } catch (error) {
            ErrorHandler.handleCcxtError(error);
        }
    }
}

export class AppInitializer {
    constructor(withdrawOptionsClass, symbolWithdraw, network, address) {
        this.withdrawOptions = new withdrawOptionsClass();
        this.withdrawOptions.symbolWithdraw = symbolWithdraw;
        this.withdrawOptions.network = network;
        this.exchange = ExchangeFactory.create();
        this.address = address;
    }

    async run() {
        await new OkxWithdraw(this.exchange, this.withdrawOptions).execute(this.address);
    }
}