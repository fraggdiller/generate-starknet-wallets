// WalletSaver.js
import fs from 'fs';
import path from 'path';

export class WalletSaver {
    static saveDataToFiles(walletsData, dataFolderPath, prefix) {
        const csvData = walletsData.map(data => `${data.seed},${data.address},${data.privateKey},${data.publicKey}`).join("\n");
        const seedsData = walletsData.map(data => data.seed).join("\n");
        const addressesData = walletsData.map(data => data.address).join("\n");
        const privateKeysData = walletsData.map(data => data.privateKey).join("\n");
        const publicKeysData = walletsData.map(data => data.publicKey).join("\n");

        if (!fs.existsSync(dataFolderPath)) {
            fs.mkdirSync(dataFolderPath);
        }

        fs.writeFileSync(path.join(dataFolderPath, `${prefix}_wallets.csv`), "Seed,Address,Private Key,Public Key\n" + csvData);
        fs.writeFileSync(path.join(dataFolderPath, `${prefix}_seeds.txt`), seedsData);
        fs.writeFileSync(path.join(dataFolderPath, `${prefix}_addresses.txt`), addressesData);
        fs.writeFileSync(path.join(dataFolderPath, `${prefix}_private_keys.txt`), privateKeysData);
        fs.writeFileSync(path.join(dataFolderPath, `${prefix}_public_keys.txt`), publicKeysData);

        console.log(`Wallets generated and saved to files with prefix "${prefix}" successfully.`);
    }
}
