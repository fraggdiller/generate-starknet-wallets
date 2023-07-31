// argentkeyDerivation.js
import { BigNumber, utils } from "ethers";
import { ec, number } from "starknet";
import pkg from 'lodash';

const { isNumber } = pkg;


export const getStarkPair = (indexOrPath, secret, baseDerivationPath) => {
    const masterNode = utils.HDNode.fromSeed(BigNumber.from(secret).toHexString());

    const path = isNumber(indexOrPath)
        ? getPathForIndex(indexOrPath, baseDerivationPath ?? "")
        : indexOrPath;
    const childNode = masterNode.derivePath(path);
    const groundKey = grindKey(childNode.privateKey);
    return ec.getKeyPair(groundKey);
};


const getPathForIndex = (index, baseDerivationPath) => {
    return `${baseDerivationPath}/${index}`;
};


const grindKey = (keySeed) => {
    const keyValueLimit = ec.ec.n;
    if (!keyValueLimit) {
        return keySeed;
    }
    const sha256EcMaxDigest = number.toBN(
        "1 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000",
        16
    );
    const maxAllowedVal = sha256EcMaxDigest.sub(
        sha256EcMaxDigest.mod(keyValueLimit)
    );

    let i = 0;
    let key;
    do {
        key = hashKeyWithIndex(keySeed, i);
        i++;
    } while (!key.lt(maxAllowedVal));

    return "0x" + key.umod(keyValueLimit).toString("hex");
};


const hashKeyWithIndex = (key, index) => {
    const payload = utils.concat([utils.arrayify(key), utils.arrayify(index)]);
    const hash = utils.sha256(payload);
    return number.toBN(hash);
};
