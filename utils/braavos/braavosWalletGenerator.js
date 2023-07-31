// WalletGenerator.js
import { MnemonicGenerator } from "../MnemonicGenerator.js";
import { calculateBraavosAddress, computePkeys } from "../helpers.js";


export class BraavosWalletGenerator {
    static getWalletData = async () => {
        const mnemonic = await MnemonicGenerator.generateMnemonicPhrase();
        const keys = computePkeys(mnemonic);
        const publicKey = keys.publicKey;
        const privateKey = keys.privateKey;

        const address = calculateBraavosAddress(publicKey);

        return {
            seed: mnemonic,
            address: address,
            privateKey: privateKey,
            publicKey: publicKey
        };
    }
}
