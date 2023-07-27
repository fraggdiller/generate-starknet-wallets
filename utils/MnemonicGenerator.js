// MnemonicGenerator.js
import { ethers } from "ethers";

export class MnemonicGenerator {
    static generateMnemonicPhrase() {
        const wallet = ethers.Wallet.createRandom();
        return wallet.mnemonic.phrase;
    }
}
