import fs from 'fs-extra';
import { getPrivateKey, getAddress } from "./helpers.js";
import { MnemonicGenerator } from "./MnemonicGenerator.js";

export default async function GenerateWallets(walletName,counter,flag) {
    if (((walletName !== 'argent') && (walletName !=='braavos'))){
        console.log('Please, use wallet name argent/braavos\n npm run generate argent\n npm run generate braavos')
    } else if ((counter === undefined) || (counter <=0)){
        console.log('Please, use wallet number\n npm run generate -- argent 30\nnpm run generate -- braavos 30')
    } else {
        const fileExists = await fs.pathExists('./data/generated.csv');
        if (!fileExists) {
            await fs.writeFile('./data/generated.csv', 'WalletName,Address,Mnemonic,PrivateKey\n');
            await Generate(walletName,counter)
        } else {
            if (flag === 'new') {
                await fs.unlink('./data/generated.csv');
                await fs.writeFile('./data/generated.csv', 'WalletName,Address,Mnemonic,PrivateKey\n');
                await Generate(walletName,counter)
            }
            if (flag !== 'new') {console.log('File ./data/generated.csv already exist, if you want to genetare new wallets, use:\nnpm run generate -- argent 30 new')}
        }
    }
}

const Generate = async (walletName,counter) =>{
    const stream = fs.createWriteStream('./data/generated.csv', {flags: 'a'});

    for (let i = 0; i<counter;i++){
        const mnemonic = await MnemonicGenerator.generateMnemonicPhrase()
        const privateKey = await getPrivateKey(mnemonic,walletName);
        const address = await getAddress(privateKey,walletName);

        stream.write(`${walletName},${address},${mnemonic},${privateKey}\n`);
    }

    stream.end();
    console.log('Data Saved successfully to generated.csv');
    console.log("Don't forget to add addresses to OKX white list")
}