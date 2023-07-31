export class General {
    static wallet = 'braavos'; // 'braavos' | 'argent'
    static generate = false;  // generate wallets | true || false |
    static deploy = true;  // deploy wallets  | true || false |

    static numWallets = 10;  // number of wallets to generate | 1 || n
    static delay = [1, 5];  // delay in seconds between deploying wallets | 1 || n |
    static num_deployers = 5;  // how many wallets will deploy at the same time
}

export class OKXAuth {
    static use_okx_proxy = true;  // use proxy | true || false |
    static okx_proxy = 'http://puWPCT:4c8Pms@45.133.210.201:8000';  // proxy url | http://login:password@ip:port |
    static okx_apiKey = 'e7f1b1d0-6d6f-4825-94dd-4ceabb3240ac';
    static okx_apiSecret = 'FDF9D47EC9ADF86073F8557C5FBC1E51';
    static okx_apiPassword = '123321Aa@';
}

export class OKXWithdrawOptions {
    static amount = [0.0002, 0.0003];  // 0.0002 recommended (deploy fee is ~0.00015)
    static withdraw_fee = [0.0001, 0.0002];  // not recommended to change
}
