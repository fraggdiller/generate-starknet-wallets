// WalletGenerator.js
import { ec, encode } from "starknet";
import { getStarkPair } from "./keyDerivation.js";
import { MnemonicGenerator } from "./MnemonicGenerator.js";
import { ethers } from "ethers";
import { build_ConstructorCallData, calculateAddress } from "./helpers.js";

const { sanitizeBytes, addHexPrefix } = encode;


export class WalletGenerator {
    static async getWalletData(baseDerivationPath, argentXproxyClassHash, argentXaccountClassHash) {
        const mnemonic = await MnemonicGenerator.generateMnemonicPhrase();
        const ethersWallet = ethers.Wallet.fromMnemonic(mnemonic);
        const index = 0;

        const starkPair = getStarkPair(index, ethersWallet.privateKey, baseDerivationPath);
        const publicKey = ec.getStarkKey(starkPair);
        const privateKey = addHexPrefix(sanitizeBytes(starkPair.getPrivate("hex")));

        const ConstructorCallData = await build_ConstructorCallData(argentXaccountClassHash, publicKey);

        const address = await calculateAddress(publicKey, argentXproxyClassHash, ConstructorCallData)

        return {
            seed: mnemonic,
            address: address,
            privateKey: privateKey,
            publicKey: publicKey
        };
    }
}
