// ArgentWalletGenerator.js
import { ec, encode } from "starknet";
import { getStarkPair } from "./argentkeyDerivation.js";
import { MnemonicGenerator } from "../MnemonicGenerator.js";
import { ethers } from "ethers";
import {build_ConstructorCallData, calculateArgentAddress} from "../helpers.js";
import {baseDerivationPath} from "../constants.js";

const { sanitizeBytes, addHexPrefix } = encode;


export class ArgentWalletGenerator {
    static async getWalletData() {
        const mnemonic = await MnemonicGenerator.generateMnemonicPhrase();
        const ethersWallet = ethers.Wallet.fromMnemonic(mnemonic);
        const index = 0;

        const starkPair = getStarkPair(index, ethersWallet.privateKey, baseDerivationPath);
        const publicKey = ec.getStarkKey(starkPair);
        const privateKey = addHexPrefix(sanitizeBytes(starkPair.getPrivate("hex")));

        const ConstructorCallData = await build_ConstructorCallData(publicKey);

        const address = await calculateArgentAddress(publicKey, ConstructorCallData);

        return {
            seed: mnemonic,
            address: address,
            privateKey: privateKey,
            publicKey: publicKey
        };
    }
}
