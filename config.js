export class General {
    static cairo = 1; // use 0 or 1 for get data, and only 1 for generate and deploy
    static delay = [10, 20];  // delay in seconds between deploying wallets | 1 || n |
    static attempts = 3; // attempts if transaction is failed
    static depositImmediately = false; // Top up wallet in the first withdraw
    static depositMin = 0.0015; // min deposit wallet amount
    static depositMax = 0.003; // max deposit wallet amount
    static depositRandomStep = 0.00002; // randomizer step
    static nodeUrl = '';

    static getBalanceSort = false;
}


export class OKXAuth {
    //Optional
    static okx_proxy = '';  // proxy url | http://login:password@ip:port |
    static okx_apiKey = '';
    static okx_apiSecret = '';
    static okx_apiPassword = '';
}
