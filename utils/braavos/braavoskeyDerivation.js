import { utils } from "ethers";
import { constants, ec } from "starknet";
import { baseDerivationPath } from "../constants.js";

const EIP2645Hashing = (key0) => {
    const N = BigInt(2) ** BigInt(256);
    const starkCurveOrder = BigInt(`0x${constants.EC_ORDER}`);

    const N_minus_n = N - (N % starkCurveOrder);
    for (let i = 0; ; i++) {
        const x = utils.concat([key0, utils.arrayify(i)]);

        const key = BigInt(utils.hexlify(utils.sha256(x)));

        if (key < N_minus_n) {
            return `0x${(key % starkCurveOrder).toString(16)}`;
        }
    }
};


export const getBraavosStarkPair = (mnemonic, accountIndex) => {
    const seed = utils.mnemonicToSeed(mnemonic);
    let hdnode = utils.HDNode.fromSeed(seed);
    hdnode = hdnode.derivePath(`${baseDerivationPath}/${accountIndex}`);
    const groundKey = EIP2645Hashing(hdnode.privateKey);
    const starkPair = ec.getKeyPair(groundKey);
    return { starkPair, groundKey };
};