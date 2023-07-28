// helpers.js
import { Contract, hash, RpcProvider, stark } from "starknet";
import fs from "fs";
import { General, OKXWithdrawOptions } from "../config.js"
import { AppInitializer } from "./OkxWithdraw.js";
import { network, symbolWithdraw } from "./constants.js";
import { DeployWallet } from "./DeployWallet.js";

export const checkBalance = async (rpc, walletAddress, tokenAddress, abiAddress) => {
    const provider = new RpcProvider({ nodeUrl: rpc });

    if (!abiAddress) {
        abiAddress = tokenAddress
    }

    const { abi: abi } = await provider.getClassAt(abiAddress);
    if (abi === undefined) {
        throw new Error("no abi.")
    }

    const contract = new Contract(abi, tokenAddress, provider);
    const balance = await contract.functions.balanceOf(walletAddress);
    return balance[0].low;
};

const randomDelay = () => {
    const seconds = Math.random() * (General.delay[1] - General.delay[0]) + General.delay[0];
    console.log(`Delaying ${seconds} seconds`)
    return Math.round(seconds * 1000);
};

export const sleep = (milliseconds) => {
    if (typeof milliseconds === 'number' && !isNaN(milliseconds)) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    } else {
        const randomMilliseconds = randomDelay();
        return new Promise((resolve) => setTimeout(resolve, randomMilliseconds));
    }
};

export const build_ConstructorCallData = async (argentXaccountClassHash, publicKey) => {
    return stark.compileCalldata({
        implementation: argentXaccountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: stark.compileCalldata({ signer: publicKey, guardian: "0" }),
    });
};

export const calculateAddress = async (publicKey, argentXproxyClassHash, ConstructorCallData) => {
    return hash.calculateContractAddressFromHash(
        publicKey,
        argentXproxyClassHash,
        ConstructorCallData,
        0
    );
};

export const build_deployAccountPayload = async (argentXproxyClassHash, ConstructorCallData, address, publicKey) => {
    return {
        classHash: argentXproxyClassHash,
        constructorCalldata: ConstructorCallData,
        contractAddress: address,
        addressSalt: publicKey
    }
};

export const loadWallets = async (addressesFilePath, privateKeysFilePath, publicKeysFilePath) => {
    try {
        const addresses = fs.readFileSync(addressesFilePath, "utf8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        const privateKeys = fs.readFileSync(privateKeysFilePath, "utf-8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        const publicKeys = fs.readFileSync(publicKeysFilePath, "utf-8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        return { addresses, privateKeys, publicKeys };
    } catch (err) {
        console.error(`Error while loading wallet data: ${err.message}`);
        throw err;
    }
};

export const deployWallets = async (addresses, privateKeys, publicKeys, concurrencyLimit) => {
    const numWallets = addresses.length;
    const results = [];

    async function deploySingleWallet(index) {
        const address = addresses[index];
        const privateKey = privateKeys[index];
        const publicKey = publicKeys[index];

        const appInitializer = new AppInitializer(OKXWithdrawOptions, symbolWithdraw, network, address);
        await sleep();
        await appInitializer.run();

        const deployWallet = new DeployWallet(address, privateKey, publicKey);
        return await deployWallet.deployWallet();
    }

    for (let i = 0; i < numWallets; i += concurrencyLimit) {
        const currentConcurrency = Math.min(concurrencyLimit, numWallets - i);
        const walletPromises = [];
        for (let j = 0; j < currentConcurrency; j++) {
            walletPromises.push(deploySingleWallet(i + j));
        }

        const resultsSlice = await Promise.allSettled(walletPromises);
        results.push(...resultsSlice.filter((result) => result.status === 'fulfilled').map((result) => result.value));

        if (i + currentConcurrency < numWallets) {
            await sleep(0.5);
        }
    }

    return results;
};
