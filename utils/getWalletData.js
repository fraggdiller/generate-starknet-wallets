import fs from 'fs-extra';
import {getPrivateKey, getAddress, checkDeploy} from "./helpers.js";

export default async function getWalletData(walletName) {
    if (((walletName !== 'argent') && (walletName!=='braavos'))){
        console.log('Please, use wallet name argent/braavos\n npm run data argent\n npm run data braavos')
    } else {
        const mnemonics = fs.readFileSync('./data/Mnemonics.txt', "utf8")
                            .split("\n")
                            .map(row => row.trim())
                            .filter(row => row !== "");

        const fileExists = await fs.pathExists('./data/wallets.csv');

        let existingData = [];

        if (fileExists) {
            existingData = (await fs.readFile('./data/wallets.csv', 'utf8'))
                .split("\n")
                .filter(row => row.trim().length > 0)
                .map(row => row.split(","));
        } else {
            await fs.writeFile('./data/wallets.csv', 'WalletName,isDeployed,Address,Mnemonic,PrivateKey\n');
            existingData = [['WalletName','isDeployed','Address','Mnemonic','PrivateKey']];
        }

        for (let mnemonic of mnemonics){
            const privateKey = await getPrivateKey(mnemonic,walletName);
            const address = await getAddress(privateKey,walletName);
            const deployed = await checkDeploy(address,privateKey);

            const existingRow = existingData.find(row => row[2] === address);
            if (existingRow) {
                existingRow[1] = deployed;
            } else {
                existingData.push([walletName, deployed, address, mnemonic, privateKey]);
            }
        }

        const stream = fs.createWriteStream('./data/wallets.csv');
        existingData.forEach(row => stream.write(row.join(',') + '\n'));
        stream.end();

        console.log('Data Saved successfully to wallets.csv');
    }
}
