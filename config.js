export class General {
    static delay = [10, 20];  // delay in seconds between deploying wallets | 1 || n |
    static attempts = 3; // attempts if transaction is failed
}


export class OKXAuth {
    static okx_proxy = '';  // proxy url | http://login:password@ip:port |
    static okx_apiKey = '';
    static okx_apiSecret = '';
    static okx_apiPassword = '';
}
