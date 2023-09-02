import { Account, constants, ec, Provider, stark } from 'starknet';
import { General } from "../config.js";
import TxConfirmation from "./txConfirmation.js";
import { FromOkxToWallet } from "./OkxWithdraw.js";
import csv from 'csv-parser';
import fs from 'fs-extra';

import {
    build_ConstructorCallData,
    build_deployAccountPayload,
    checkBalance,
    checkDeploy,
    deployBraavosAccount,
    getArgentAddress,
    performWitdrawBraavos,
    precision
} from './helpers.js';


const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });


export default async function deployAccount() {
    let generatedCSV = await fs.readFile('./data/generated.csv', 'utf8');

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

    let walletsCSV = await fs.readFile('./data/wallets.csv', 'utf8');
    let wallets = walletsCSV.split('\n').map(line => line.split(','));

    try {
        for (const row of rows) {
            const { WalletName: walletName, Address: address, Mnemonic: mnemonic, PrivateKey: privateKey } = row;

            const deployed = await checkDeploy(address, privateKey);

            if (walletName === 'braavos' && !deployed) {
                await performWitdrawBraavos(address, privateKey, provider)
            }

            let success;
            if ((walletName === 'argent' || walletName === 'braavos') && !deployed) {
                console.log(`Start deploying ${address}`)
                const deploy = walletName === 'argent' ? DeployArgent : DeployBraavos;
                success = await deploy(privateKey, address, walletName);
            }
            if (success || deployed) {
                const walletIndex = wallets.findIndex(w => w[2] === address);
                if (walletIndex === -1) {
                    wallets = wallets.filter(wallet => wallet.join(',').trim() !== '');
                    wallets.push([walletName, 'true', address, mnemonic, privateKey]);
                } else {
                    wallets[walletIndex] = [walletName, 'true', address, mnemonic, privateKey];
                }
            }
            const newGeneratedCSV = generatedCSV.split('\n')[0] + '\n' + rows.map(row => `${row.WalletName},${row.Address},${row.Mnemonic},${row.PrivateKey}`).join('\n');
            await fs.writeFile('./data/generated.csv', newGeneratedCSV);
            const newWalletsCSV = wallets.map(wallet => wallet.join(',')).join('\n');
            await fs.writeFile('./data/wallets.csv', newWalletsCSV);
        }


        for (const wallet of wallets.slice(1)) {
            const [walletName, isDeployed, address, mnemonic, privateKey] = wallet;

            if (isDeployed === 'false') {
                if (walletName === 'braavos') {
                    await performWitdrawBraavos(address, privateKey, provider)
                }

                let success;
                if (walletName === 'argent' || walletName === 'braavos') {
                    console.log(`Start deploying ${address}`)
                    const deploy = walletName === 'argent' ? DeployArgent : DeployBraavos;
                    success = await deploy(privateKey, address, walletName);
                }
                if (success) {
                    const index = wallets.findIndex(w => w[2] === address);
                    if (index !== -1) {
                        wallets[index] = [walletName, 'true', address, mnemonic, privateKey];
                    }
                }
            }

            const newWalletsCSV = wallets.map(wallet => wallet.join(',')).join('\n');
            await fs.writeFile('./data/wallets.csv', newWalletsCSV);
        }

    } catch (error) {
        console.error(error);
    } finally {
        console.log('CSV file successfully processed');
    }
}


const DeployArgent = async (privateKey) => {
    const address = await getArgentAddress(privateKey);
    const account = new Account(provider, address, privateKey);
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    const ConstructorCallData = await build_ConstructorCallData(publicKey);
    const txPayload = await build_deployAccountPayload(ConstructorCallData, address, publicKey);

    const balance = await checkBalance(address);
    let estimatedFee = (await account.estimateAccountDeployFee(txPayload, { skipValidate: false })).suggestedMaxFee;
    let estimatedMaxFee = stark.estimatedFeeToMaxFee(estimatedFee);

    let fee;
    if (balance < estimatedMaxFee) {
        fee = estimatedMaxFee - balance
        fee = Number(estimatedMaxFee)
        fee = fee / 10 ** 18;
        let randomNumber = Math.random() * (1.3 - 1.1) + 1.1;
        randomNumber = await precision(randomNumber, 2);
        fee = fee * randomNumber;
        fee = await precision(fee, 6);
        await FromOkxToWallet(address, fee);
    }

    let success = false;
    let attempts = 0;

    while (attempts < General.attempts && !success) {
        success = await new TxConfirmation(txPayload, address, privateKey, 'argent').execute();
        attempts++;
    }

    return success;
};

const DeployBraavos = async (privateKey)=> {
    let success = false;
    let attempts = 0;

    while (attempts < General.attempts && !success) {
        success = await deployBraavosAccount(privateKey, provider)
        attempts++;
    }

    return success;
}