// DeployWallet.js
import { Provider } from "starknet";
import { starkscan, retries, status } from "../constants.js";
import { deployAccount, estimateAccountDeployFee } from "../helpers.js";

export class BraavosDeployWallet {
    constructor(privateKey, mnemonic) {
        this.privateKey = privateKey;
        this.provider = new Provider({ sequencer: { network: 'mainnet-alpha' } });
        this.mnemonic = mnemonic;
    }

    async deployWallet () {
        try {
            const estimatedFee = await estimateAccountDeployFee(this.privateKey, this.provider, this.mnemonic);

            const {transaction_hash: tx_hash, contract_address: finalAddress} =
                await deployAccount(this.privateKey, this.mnemonic, this.provider, estimatedFee);

            const tx_status = await this.provider.waitForTransaction(tx_hash, retries, [status]);
            console.log(`Wallet deployed at address: ${finalAddress}`);
            console.log(`Tx Status is: ${tx_status.status} | See transaction on explorer: ${starkscan + tx_hash}`);
            return finalAddress;
        } catch (error) {
            console.log('An error occurred: ', error);
        }
    }
}