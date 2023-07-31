// argentDeployWallet.js
import { Account, Provider, ec } from "starknet";
import { starkscan, retries, status } from "../constants.js";
import { build_ConstructorCallData, build_deployAccountPayload } from "../helpers.js";

export class ArgentDeployWallet {
    constructor(address, privateKey, publicKey) {
        this.address = address;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.provider = new Provider({ sequencer: { network: 'mainnet-alpha' } });
        this.KeyPair = ec.getKeyPair(this.privateKey)
        this.account = new Account(this.provider, this.address, this.KeyPair);
    }

    async deployWallet() {
        const ConstructorCallData = await build_ConstructorCallData(this.publicKey);
        const deployAccountPayload = await build_deployAccountPayload(ConstructorCallData, this.address, this.publicKey);
        try {

            const {
                transaction_hash: tx_hash,
                contract_address: finalAddress
            } = await this.account.deployAccount(deployAccountPayload);

            const tx_status = await this.provider.waitForTransaction(tx_hash, retries, [status]);
            console.log(`Wallet deployed at address: ${finalAddress}`);
            console.log(`Tx Status is: ${tx_status.status} | See transaction on explorer: ${starkscan + tx_hash}`);
            return finalAddress;
        } catch (error) {
            console.log('An error occurred: ', error)
        }
    }
}