import ccxt from "ccxt";
import {General, OKXAuth} from '../config.js';
import { checkBalance, setupDelay, waitForUpdateBalance } from './helpers.js';

export const FromOkxToWallet = async (address, amount) => {

    let attempts = General.attempts
    while (attempts > 0) {
        try {
            const handleCcxtError = (e) => {
                const errorType = e.constructor.name;
                console.error(`An error occurred ${errorType}.`);
                console.error(`Error details ${e}.`);
            }

            const exchange_options = {
                'apiKey': OKXAuth.okx_apiKey,
                'secret': OKXAuth.okx_apiSecret,
                'password': OKXAuth.okx_apiPassword,
                'enableRateLimit': true,
            };

            const exchange = new ccxt.okx(exchange_options);

            exchange.https_proxy = OKXAuth.okx_proxy

            const info = await exchange.fetchCurrencies('ETH');
            let minWd = info.ETH.networks.StarkNet.info.minWd;
            minWd = parseFloat(minWd) * 2;

            if (amount < minWd) {
                amount = minWd;
            }

            let withdrawFee;
            try {
                const fees = await exchange.fetchDepositWithdrawFees(['ETH']);
                const feeInfo = fees.ETH.networks.StarkNet;
                if (feeInfo) {
                    withdrawFee = feeInfo.withdraw.fee;

                } else {
                    withdrawFee = Math.random() * (0.0002 - 0.0001) + 0.0002;
                }
            } catch (error) {
                handleCcxtError(error);
                withdrawFee = Math.random() * (0.0002 - 0.0001) + 0.0002;
            }

            console.log(`Start withdrawal ${amount} ETH to StarkNet on ${address}`)
            const chainName = 'ETH' + 'StarkNet';
            let balanceCache = await checkBalance(address)
            await exchange.withdraw('ETH', amount, address, {
                toAddress: address,
                chainName: chainName,
                dest: 4,
                fee: withdrawFee,
                pwd: '-',
                amt: amount,
                network: 'StarkNet'
            });

            console.log(`Start waiting for deposit 120 seconds....`)
            await waitForUpdateBalance(address, balanceCache);
            await setupDelay(General.delay);
            break;

        } catch (e) {
            attempts--;
            if (attempts === 0) { break }
            console.error(e);
        }
    }
}
