// helpers.js
import fs from "fs";
import { constants, Contract, ec, hash, RpcProvider, stark } from "starknet";
import { General, OKXWithdrawOptions } from "../config.js"
import { AppInitializer } from "./OkxWithdraw.js";
import { ArgentDeployWallet } from "./argent/argentDeployWallet.js";
import { BraavosDeployWallet } from "./braavos/braavosDeployWallet.js";
import { getBraavosStarkPair } from "./braavos/braavoskeyDerivation.js";

import {
    argentaddressesFilePath,
    argentprivateKeysFilePath,
    argentpublicKeysFilePath,
    argentXaccountClassHash,
    argentXproxyClassHash,
    braavosaddressesFilePath,
    braavosprivateKeysFilePath,
    braavosmnemonicsFilePath,
    braavosAccountClassHash,
    braavosInitialClassHash,
    braavosProxyClassHash,
    index,
    network,
    parsedOtherSigner,
    symbolWithdraw
} from "./constants.js";



export const checkBalance = async (rpc, walletAddress, tokenAddress, abiAddress) => {
    const provider = new RpcProvider({ nodeUrl: rpc });

    if (!abiAddress) {
        abiAddress = tokenAddress;
    }

    const { abi: abi } = await provider.getClassAt(abiAddress);
    if (abi === undefined) {
        throw new Error("no abi.");
    }

    const contract = new Contract(abi, tokenAddress, provider);
    const balance = await contract.functions.balanceOf(walletAddress);
    return balance[0].low;
};


const randomDelay = () => {
    const seconds = Math.random() * (General.delay[1] - General.delay[0]) + General.delay[0];
    console.log(`Delaying ${seconds} seconds`);
    return Math.round(seconds * 1000);
};


export const sleep = (seconds) => {
    if (typeof seconds === 'number' && !isNaN(seconds)) {
        const milliseconds = seconds * 1000;
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    } else {
        const randomMilliseconds = randomDelay();
        return new Promise((resolve) => setTimeout(resolve, randomMilliseconds));
    }
};


export const loadArgentWallets = async () => {
    try {
        const addresses = fs.readFileSync(argentaddressesFilePath, "utf8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        const privateKeys = fs.readFileSync(argentprivateKeysFilePath, "utf-8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        const publicKeys = fs.readFileSync(argentpublicKeysFilePath, "utf-8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        return { addresses, privateKeys, publicKeys };
    } catch (err) {
        console.error(`Error while loading wallet data: ${err.message}`);
        throw err;
    }
};


export const loadBraavosWallets = async () => {
    try {
        const addresses = fs.readFileSync(braavosaddressesFilePath, "utf8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        const privateKeys = fs.readFileSync(braavosprivateKeysFilePath, "utf-8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        const mnemonics = fs.readFileSync(braavosmnemonicsFilePath, "utf-8")
            .split("\n")
            .map(row => row.trim())
            .filter(row => row !== "");

        return { addresses, privateKeys, mnemonics };
    } catch (err) {
        console.error(`Error while loading wallet data: ${err.message}`);
        throw err;
    }
};


export const computePkeys = (mnemonic) => {
    const pair = getBraavosStarkPair(mnemonic, index);
    const starkPair = pair.starkPair;
    const publicKey = ec.getStarkKey(pair.starkPair);
    const privateKey = pair.groundKey;
    return { starkPair, publicKey, privateKey };
};


const calculateInitializer = (publicKey) => {
    return stark.compileCalldata({ public_key: publicKey });
};


const build_proxyConstructor = (Initializer) => {
    return stark.compileCalldata({
        implementation_address: braavosInitialClassHash,
        initializer_selector: hash.getSelectorFromName('initializer'),
        calldata: [...Initializer],
    });
};


const build_proxyConstructorCallData = (publicKey) => {
    const Initializer = calculateInitializer(publicKey);
    return build_proxyConstructor(Initializer);
};


const getSignature = (
    address,
    proxyConstructorCallData,
    publicKey,
    version,
    max_fee,
    chainId,
    nonce,
    mnemonic) => {
    const txnHash = hash.calculateDeployAccountTransactionHash(
        address,
        braavosProxyClassHash,
        proxyConstructorCallData,
        publicKey,
        version,
        max_fee,
        chainId,
        nonce
    );

    const starkPair = computePkeys(mnemonic).starkPair;

    const ecSign = ec.sign(
        starkPair,
        hash.computeHashOnElements([txnHash, braavosAccountClassHash, ...parsedOtherSigner]));

    const r = ecSign[0];
    const s = ecSign[1];

    return [ r.toString(), s.toString(), braavosAccountClassHash.toString(), ...parsedOtherSigner.map((e) => e.toString()) ];
};


export const calculateBraavosAddress = (publicKey) => {
    const ProxyConstructorCallData = build_proxyConstructorCallData(publicKey);

    return hash.calculateContractAddressFromHash(
        publicKey,
        braavosProxyClassHash,
        ProxyConstructorCallData,
        0
    );
};


const buildAccountDeployPayload = async (
    privateKey,
    mnemonic,
    { classHash, addressSalt, constructorCalldata, contractAddress: providedContractAddress },
    { nonce, chainId, version, maxFee }) => {
    const compiledCalldata = stark.compileCalldata(constructorCalldata ?? []);
    const publicKey = computePkeys(mnemonic).publicKey;
    const contractAddress = providedContractAddress ?? calculateBraavosAddress(publicKey);
    const signature = getSignature(
        contractAddress,
        compiledCalldata,
        publicKey,
        BigInt(version),
        maxFee,
        chainId,
        BigInt(nonce),
        mnemonic
    );

    return {
        classHash,
        addressSalt,
        constructorCalldata: compiledCalldata,
        signature,
    };
};


export const estimateAccountDeployFee = async (privateKey, provider, mnemonic, { blockIdentifier, skipValidate } = {}) => {
    const version = hash.feeTransactionVersion;
    const nonce = constants.ZERO;
    const chainId = await provider.getChainId();
    const cairoVersion = '0';
    const publicKey = computePkeys(mnemonic).publicKey;
    const ProxyAddress = calculateBraavosAddress(publicKey);
    const ProxyConstructorCallData = build_proxyConstructorCallData(publicKey);

    const payload = await buildAccountDeployPayload(
        privateKey,
        mnemonic,
        {
            classHash: braavosProxyClassHash.toString(),
            addressSalt: publicKey,
            constructorCalldata: ProxyConstructorCallData,
            contractAddress: ProxyAddress
        },
        {
            nonce,
            chainId,
            version,
            walletAddress: ProxyAddress,
            maxFee: constants.ZERO,
            cairoVersion
        });

    const response = await provider.getDeployAccountEstimateFee(
        { ...payload },
        { version, nonce },
        blockIdentifier,
        skipValidate
    );
    return stark.estimatedFeeToMaxFee(response.overall_fee);
};


export const deployAccount = async (privateKey, mnemonic, provider, max_fee) => {
    const nonce = constants.ZERO;
    const publicKey = computePkeys(mnemonic).publicKey;
    const ProxyAddress = calculateBraavosAddress(publicKey);
    const ProxyConstructorCallData = build_proxyConstructorCallData(publicKey);
    max_fee ??= await estimateAccountDeployFee(privateKey, provider, mnemonic);
    const version = hash.transactionVersion;

    const signature = getSignature(
        ProxyAddress,
        ProxyConstructorCallData,
        publicKey,
        version,
        max_fee,
        await provider.getChainId(),
        nonce,
        mnemonic);

    return provider.deployAccountContract(
        {
            classHash: braavosProxyClassHash.toString(),
            addressSalt: publicKey,
            constructorCalldata: ProxyConstructorCallData,
            signature: signature,
        },
        {
            nonce,
            maxFee: max_fee,
            version,
        }
    );
};


export const build_ConstructorCallData = async (publicKey) => {
    return stark.compileCalldata({
        implementation: argentXaccountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: stark.compileCalldata({ signer: publicKey, guardian: "0" }),
    });
};


export const calculateArgentAddress = async (publicKey, ConstructorCallData) => {
    return hash.calculateContractAddressFromHash(
        publicKey,
        argentXproxyClassHash,
        ConstructorCallData,
        0
    );
};


export const build_deployAccountPayload = async (ConstructorCallData, address, publicKey) => {
    return {
        classHash: argentXproxyClassHash,
        constructorCalldata: ConstructorCallData,
        contractAddress: address,
        addressSalt: publicKey
    }
};


const deployWalletsBatch = async (addresses, privateKeys, deployFunction, concurrencyLimit) => {
    const numWallets = addresses.length;
    const results = [];

    async function deploySingleWallet(index) {
        const address = addresses[index];
        const privateKey = privateKeys[index];
        return await deployFunction(address, privateKey);
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


export const deployArgentWallets = async (addresses, privateKeys, publicKeys, concurrencyLimit) => {
    const deployFunction = async (address, privateKey) => {
        const publicKey = publicKeys[addresses.indexOf(address)];
        const appInitializer = new AppInitializer(OKXWithdrawOptions, symbolWithdraw, network, address);
        await sleep();
        await appInitializer.run();
        await sleep();
        const deployWallet = new ArgentDeployWallet(address, privateKey, publicKey);
        return await deployWallet.deployWallet();
    };

    return deployWalletsBatch(addresses, privateKeys, deployFunction, concurrencyLimit);
};


export const deployBraavosWallets = async (addresses, privateKeys, mnemonics, concurrencyLimit) => {
    const deployFunction = async (address, privateKey) => {
        const mnemonic = mnemonics[addresses.indexOf(address)];
        const appInitializer = new AppInitializer(OKXWithdrawOptions, symbolWithdraw, network, address);
        await sleep();
        await appInitializer.run();
        await sleep();
        const deployWallet = new BraavosDeployWallet(privateKey, mnemonic);
        return await deployWallet.deployWallet();
    };

    return deployWalletsBatch(addresses, privateKeys, deployFunction, concurrencyLimit);
};
