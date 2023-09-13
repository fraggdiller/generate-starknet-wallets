import { Account, constants, hash, Provider } from 'starknet';
import { General } from "../config.js";
import { estimateAccountDeployFee, setupDelay } from './helpers.js';


export default class TxConfirmation {
    constructor (txPayload,address, privateKey, walletName) {
        this.txPayload = txPayload;
        this.address = address;
        this.provider =  new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });
        this.privateKey = privateKey;
        this.walletName = walletName;

    }

    async execute() {

        return await this.retryOnFail(async () => {
            const account = new Account(this.provider, this.address, this.privateKey);

            try {

                let nonceCash;
                let nonce;
                try {
                    nonceCash = await account.getNonce();
                    nonceCash = parseInt(nonceCash, 16);
                } catch (e) {
                    nonceCash = 0;
                    console.log(`Error while fetching nonce: ${e}`);
                }
                let executeHash;

                if (this.walletName === 'argent') {
                    try{
                        executeHash = await account.deploySelf(this.txPayload);
                    }catch (e) {
                        console.log(e)
                    }

                } else if (this.walletName === 'braavos') {
                    const version = hash.transactionVersion;
                    nonce = constants.ZERO
                    let fee
                    try {
                        fee = await estimateAccountDeployFee(this.privateKey,this.provider)
                    } catch (e) {
                        console.log(e)
                    }
                    try {
                        executeHash = await this.provider.deployAccountContract(
                            this.txPayload,
                            {nonce,maxFee: fee,version}
                        );
                    } catch (error) {
                        console.error(error)
                    }
                }

                console.log(`Send TX: https://starkscan.co/tx/${executeHash.transaction_hash}`);
                console.log(`Waiting for tx status...`);
                let res; let flag;

                while (true) {
                    try {
                        res = await this.provider.getTransactionReceipt(executeHash.transaction_hash);
                        if (res.status === 'ACCEPTED_ON_L2' && res.finality_status === 'ACCEPTED_ON_L2' && res.execution_status === 'SUCCEEDED') {
                           flag = 1;
                            break;
                        } else if (res.status === 'REJECTED' || res.execution_status === 'REJECTED') {
                            flag = 0;
                            break;
                        } else if (res.status === 'REVERTED' || res.execution_status === 'REVERTED') {
                            flag = -1
                            break;
                        }
                    } catch (error) {
                        console.log(error)
                        console.log('An error occurred while getting txn status.');
                        throw new Error(`An error occurred while getting txn status.`)
                    }

                    await new Promise(resolve => setTimeout(resolve, 2 * 1000));
                }

                if (flag === 1) {
                    nonce = await account.getNonce();
                    nonce = parseInt(nonce, 16);

                    if (nonce === nonceCash) {
                        console.log(`Transaction success, but nonce still low | Nonce ${ nonce }`);

                        for (let i = 0; i < 90; i++) {
                            await new Promise(resolve => setTimeout(resolve, 2 * 1000));
                            nonce = await account.getNonce();
                            nonce = parseInt(nonce, 16);
                            if (nonce > nonceCash) {
                                console.log(`\x1b[32m The transaction is fully confirmed in the blockchain | Nonce ${ nonce }\x1b[0m`);
                                await setupDelay(General.delay)
                                return true
                            }
                        }
                    } else if (nonce > nonceCash) {
                        console.log(`\x1b[32mThe transaction is fully confirmed in the blockchain | Nonce ${ nonce }\x1b[0m`);
                        await setupDelay(General.delay)
                        return true
                    }

                } else if (flag === 0) {
                    console.log(`Transaction rejected.`);
                    throw new Error(`Transaction rejected.`)
                } else if (flag === -1) {
                    console.log(`Transaction rejected.`);
                    throw new Error(`Transaction rejected.`)
                } else {
                    console.log(`Transaction rejected.`);
                    throw new Error(`Transaction rejected.`)
                }

            } catch (error) {
                console.log(`Transaction rejected.`);
                throw new Error(`Transaction rejected.`)
            }
        }, General.attempts);
    }


    async retryOnFail(func, maxAttempts) {
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                return await func();
            } catch (error) {
                console.log(`Attempt ${attempts + 1} failed with error: ${error}. Retrying...`);
                attempts++;
                await setupDelay(General.delay)
                if (attempts >= maxAttempts) {
                    return false;
                }
            }
        }
    }
}