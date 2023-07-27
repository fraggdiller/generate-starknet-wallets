import { General } from "./config.js";
import { WalletGenerator } from "./utils/WalletGenerator.js";
import { WalletSaver } from "./utils/WalletSaver.js";
import { baseDerivationPath, argentXproxyClassHash, argentXaccountClassHash, addressesFilePath, privateKeysFilePath, publicKeysFilePath } from "./utils/constants.js";
import path from 'path';
import { deployWallets, loadWallets } from './utils/helpers.js';
import { fileURLToPath } from 'url';

const numWallet = General.numWallets;
const walletsData = [];

(async () => {
    if (General.generate) {
        console.log(`Start generating ${numWallet} wallets`)
        for (let i = 0; i < numWallet; i++) {
            const walletData = await WalletGenerator.getWalletData(baseDerivationPath, argentXproxyClassHash, argentXaccountClassHash);
            walletsData.push(walletData);
        }

        const currentModulePath = path.dirname(fileURLToPath(import.meta.url));
        const dataFolderPath = path.join(currentModulePath, 'data');
        WalletSaver.saveDataToFiles(walletsData, dataFolderPath);
        console.log("Don't forget to add addresses to whitelist on OKX and disable generate in config.")
        return
    }

    if (General.deploy) {
        console.log("Starting Deploying wallets.");
        const { addresses, privateKeys, publicKeys } = await loadWallets(addressesFilePath, privateKeysFilePath, publicKeysFilePath);

        const limiter = General.num_deployers;
        const results = await deployWallets(addresses, privateKeys, publicKeys, limiter);

        console.log("Deployment completed successfully.");
        console.log("Results:", results);
    }
})();
