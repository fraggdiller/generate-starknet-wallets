// MnemonicGenerator.js
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export class MnemonicGenerator {
    static async generateMnemonicPhrase() {
        return generateMnemonic(wordlist, 128);
    }
}