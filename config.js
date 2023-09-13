export class General {
    static cairo = 1; // use 0 or 1 for get data, and only 1 for generate and deploy
    static delay = [10, 20];  // delay in seconds between deploying wallets | 1 || n |
    static attempts = 3; // attempts if transaction is failed
}


export class OKXAuth {
    static okx_proxy = '';  // proxy url | http://login:password@ip:port |
    static okx_apiKey = '';
    static okx_apiSecret = '';
    static okx_apiPassword = '';
}
