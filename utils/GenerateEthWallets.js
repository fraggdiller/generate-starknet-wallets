import { Wallet } from 'ethers'
import * as crypto from "crypto";
import fs from "fs-extra";

export default async function generateWallets(n) {
    console.log('\n ====== ' + n + "  ======  ");
    const stream = fs.createWriteStream('./data/generated_eth.csv', {flags: 'a'});


    for (let i = 1; i <= n; i++) {
        const wallet = Wallet.createRandom();
        console.log('address:', wallet.address)

        stream.write(`${wallet.address},${wallet.mnemonic.phrase},${wallet.privateKey}\n`);
    }
}
