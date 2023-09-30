import {Account, constants, Provider} from 'starknet';
import {General} from "../config.js";
import csv from 'csv-parser';
import fs from 'fs-extra';

import {checkBalance} from './helpers.js';
import { ethers } from 'ethers';


export default async function getAccountBalances() {
    const rows = await new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream('./data/generated.csv')
          .pipe(csv())
          .on('data', (row) => {
              rows.push(row);
          })
          .on('end', () => resolve(rows))
          .on('error', (error) => reject(error));
    });

    var result = [];

    for (const row of rows) {
        const { Address: address, PrivateKey: privateKey } = row;

        const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN },
            rpc: {nodeUrl: General.nodeUrl }} )

        const account = new Account(provider, address, privateKey)

        const nonce = await account.getNonce();

        const balance = await checkBalance(address);

        result.push({balance: balance, nonce: Number(nonce), address: address})
    }

    if(General.getBalanceSort){
        result.sort((a,b) => (a.balance > b.balance) ? 1 : ((b.balance > a.balance) ? -1 : 0))
    }

    result.forEach((element) => console.log(ethers.formatEther(element.balance)  + '   '  + element.nonce + '   ' + element.address));
}