import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { HDNodeWallet, Wallet } from 'ethers';
import { Account, CallData, constants, Contract, ec, hash, num, Provider, stark } from 'starknet';
import { abi } from './abi.js';
import {
    argentXaccountClassHash,
    argentXproxyClassHash,
    baseDerivationPath,
    braavosAccountClassHash,
    braavosInitialClassHash,
    braavosProxyClassHash
} from './constants.js';
import { FromOkxToWallet } from './OkxWithdraw.js';
import TxConfirmation from "./txConfirmation.js";


export const getArgentPrivateKey = async (mnemonic) => {
    const signer = (Wallet.fromPhrase(mnemonic)).privateKey;
    const masterNode = HDNodeWallet.fromSeed(
        toHexString(signer));
    const childNode = masterNode.derivePath(baseDerivationPath);

    return '0x' + ec.starkCurve.grindKey(childNode.privateKey).toString();
};


const toHexString = (value) => {
    let hex = BigInt(value).toString(16);
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
    return '0x' + hex;
};


export const build_ConstructorCallData = async (publicKey) => {
    return CallData.compile({
        implementation: argentXaccountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: CallData.compile({ signer: publicKey, guardian: "0" }),
    });
};


export const build_deployAccountPayload = async (ConstructorCallData, address, publicKey) => {
    return {
        classHash: argentXproxyClassHash,
        constructorCalldata: ConstructorCallData,
        contractAddress: address,
        addressSalt: publicKey
    }
};


export const getArgentAddress = async (privateKey) => {
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    const ConstructorCallData = await build_ConstructorCallData(publicKey);

    return hash.calculateContractAddressFromHash(
        publicKey,
        argentXproxyClassHash,
        ConstructorCallData,
        0
    );
};


export const getBraavosPrivateKey = async (mnemonic) => {
    const seed = mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const hdKeyDerived = hdKey.derive(baseDerivationPath);

    return "0x" + ec.starkCurve.grindKey(hdKeyDerived.privateKey);
};


export const getBraavosAddress = async (privateKey) => {
    const calculateInitializer = (publicKey) => {
        return CallData.compile({ public_key: publicKey });
    }

    const buildProxyConstructorCallData = (initializer) => {
        return CallData.compile({
            implementation_address: braavosInitialClassHash,
            initializer_selector: hash.getSelectorFromName('initializer'),
            calldata: [...initializer]
        });
    }

    const publicKey = ec.starkCurve.getStarkKey(num.toHex(privateKey));
    const initializer = calculateInitializer(publicKey);
    const proxyConstructorCallData = buildProxyConstructorCallData(initializer);

    return hash.calculateContractAddressFromHash(
        publicKey,
        braavosProxyClassHash,
        proxyConstructorCallData,
        0
    );
};


export const getAddress = async (privateKey,walletName) => {
    switch (walletName) {
        case "argent":
            return await getArgentAddress(privateKey);
        case 'braavos':
            return await getBraavosAddress(privateKey);

    }
}


export const getPrivateKey = async (mnemonic,walletName) => {
    switch (walletName) {
        case "argent":
            return await getArgentPrivateKey(mnemonic);
        case 'braavos':
            return await getBraavosPrivateKey(mnemonic);
    }
}


export const checkDeploy = async (addres,privateKey) => {
    try {
        const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })
        const account = new Account(provider,addres,privateKey)
        const nonce = await account.getNonce();

        if (Number(nonce) === 0){
            return false
        } else if (nonce > 0){
            return true
        }
    } catch (e) {
        return false;
    }
}


export const checkBalance = async (address) => {
    try {
        const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });

        const contract = new Contract(abi, '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', provider);

        const balance = await contract.functions.balanceOf(address);

        return balance.balance.low;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
};


export const waitForUpdateBalance = async (address, balanceCash) => {
    try {
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 120 * 1000));
            let balanceNew = await checkBalance(address);

            if (balanceNew > balanceCash) {

                console.log(`Deposit confirmed on wallet`);
                return;
            }
            else {
                console.log(`Deposit not confirmed on wallet yet, waiting 20sec...`);
            }
        }
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}


export const setupDelay = async (delay) => {
    try {
        const [mindelay, maxdelay] = delay;
        const delaySeconds =  Math.floor(Math.random() * (maxdelay - mindelay + 1)) + mindelay;
        console.log(`Delaying ${delaySeconds} seconds before next action`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
};


export const getSignature = async (
    address,
    proxyConstructorCallData,
    publicKey,
    version,
    max_fee,
    chainId,
    nonce,
    privateKey
) => {
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

    const parsedOtherSigner = [0, 0, 0, 0, 0, 0, 0];
    const { r, s } = ec.starkCurve.sign(
        hash.computeHashOnElements([txnHash, braavosAccountClassHash, ...parsedOtherSigner]),
        num.toHex(privateKey)
    );
    return [
        r.toString(),
        s.toString(),
        braavosAccountClassHash.toString(),
        ...parsedOtherSigner.map((e) => e.toString()),
    ];
}


export const calculateInit = (starkKeyPubBraavos) =>
    CallData.compile({ public_key: starkKeyPubBraavos });


export const proxyConstructor = (BraavosInitializer) =>
    CallData.compile({
        implementation_address: braavosInitialClassHash,
        initializer_selector: hash.getSelectorFromName('initializer'),
        calldata: [...BraavosInitializer],
    });


export const buildAccountDeployPayload = async (
    privateKey,
    {
        classHash,
        addressSalt,
        constructorCalldata,
        contractAddress: providedContractAddress,
    },
    { nonce, chainId, version, maxFee }
) => {
    const compiledCalldata = CallData.compile(constructorCalldata ?? []);
    const contractAddress = providedContractAddress ?? await getBraavosAddress(privateKey);
    const publicKey = ec.starkCurve.getStarkKey(num.toHex(privateKey));

    const signature = await getSignature(
        contractAddress,
        compiledCalldata,
        publicKey,
        BigInt(version),
        maxFee,
        chainId,
        BigInt(nonce),
        privateKey
    );

    return {
        classHash,
        addressSalt,
        constructorCalldata: compiledCalldata,
        signature,
    };
};


export async function estimateAccountDeployFee(
    privateKeyBraavos,
    provider,
    { blockIdentifier, skipValidate } = {}
){
    const version = hash.feeTransactionVersion;
    const nonce = constants.ZERO;

    const chainId = provider.provider.chainId.toString();

    const cairoVersion = '0';
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const BraavosProxyAddress = await getBraavosAddress(privateKeyBraavos);
    const BraavosInitializer = await calculateInit(starkKeyPubBraavos);
    const BraavosProxyConstructorCallData = await proxyConstructor(BraavosInitializer);

    const payload = await buildAccountDeployPayload(
        privateKeyBraavos,
        {
            classHash: braavosProxyClassHash.toString(),
            addressSalt: starkKeyPubBraavos,
            constructorCalldata: BraavosProxyConstructorCallData,
            contractAddress: BraavosProxyAddress,
        },
        {
            nonce,
            chainId,
            version,
            walletAddress: BraavosProxyAddress,
            maxFee: constants.ZERO,
            cairoVersion,
        }
    );

    const response = await provider.getDeployAccountEstimateFee(
        { ...payload },
        { version, nonce },
        blockIdentifier,
        skipValidate
    );
    return stark.estimatedFeeToMaxFee(response.overall_fee);
}


export async function deployBraavosAccount(
    privateKeyBraavos,
    provider,
    max_fee
){
    const nonce = constants.ZERO;
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));

    const BraavosProxyAddress = await getBraavosAddress(privateKeyBraavos);
    const BraavosInitializer = await calculateInit(starkKeyPubBraavos);
    const BraavosProxyConstructorCallData = await proxyConstructor(BraavosInitializer);
    max_fee ??= await estimateAccountDeployFee(privateKeyBraavos, provider);
    const version = hash.transactionVersion;
    const signatureBraavos = await getSignature(
        BraavosProxyAddress,
        BraavosProxyConstructorCallData,
        starkKeyPubBraavos,
        version,
        max_fee,
        await provider.getChainId(),
        nonce,
        privateKeyBraavos
    );
    const txPayload = {
        classHash: braavosProxyClassHash.toString(),
        addressSalt: starkKeyPubBraavos,
        constructorCalldata: BraavosProxyConstructorCallData,
        signature: signatureBraavos,
    }
    return await new TxConfirmation(
        txPayload,BraavosProxyAddress,privateKeyBraavos,'braavos'
    ).execute()
}


export const precision = async (number, dec) => {
    let numStr = number.toString();
    if (numStr.includes('e')) {
        numStr = Number(number).toFixed(dec + 1);
    }
    const [whole, fraction = ''] = numStr.split('.');
    const truncatedFraction = (fraction + '00000000').slice(0, dec);
    return parseFloat(whole + '.' + truncatedFraction);
};


export const performWitdrawBraavos = async (address, privateKey, provider) => {
    const balance = await checkBalance(address);
    let estimatedMaxFee = await estimateAccountDeployFee(privateKey, provider);
    if (balance < estimatedMaxFee) {
        let fee = Number(estimatedMaxFee);
        fee = fee / 10 ** 18;
        let randomNumber = Math.random() * (1.3 - 1.1) + 1.1;
        randomNumber = await precision(randomNumber, 2);
        fee = fee * randomNumber;
        fee = await precision(fee, 6);
        await FromOkxToWallet(address, fee);
    }
};