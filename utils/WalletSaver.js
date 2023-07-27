// WalletSaver.js
import fs from 'fs';
import path from 'path';

export class WalletSaver {
    static saveDataToFiles(walletsData, dataFolderPath) {
        const csvData = walletsData.map(data => `${data.seed},${data.address},${data.privateKey},${data.publicKey}`).join("\n");
        const seedsData = walletsData.map(data => data.seed).join("\n");
        const addressesData = walletsData.map(data => data.address).join("\n");
        const privateKeysData = walletsData.map(data => data.privateKey).join("\n");
        const publicKeysData = walletsData.map(data => data.publicKey).join("\n");

        if (!fs.existsSync(dataFolderPath)) {
            fs.mkdirSync(dataFolderPath);
        }

        fs.writeFileSync(path.join(dataFolderPath, "wallets.csv"), "Seed,Address,Private Key,Public Key\n" + csvData);
        fs.writeFileSync(path.join(dataFolderPath, "seeds.txt"), seedsData);
        fs.writeFileSync(path.join(dataFolderPath, "addresses.txt"), addressesData);
        fs.writeFileSync(path.join(dataFolderPath, "private_keys.txt"), privateKeysData);
        fs.writeFileSync(path.join(dataFolderPath, "public_keys.txt"), publicKeysData);

        console.log("Wallets generated and saved to files successfully.");
    }
}
