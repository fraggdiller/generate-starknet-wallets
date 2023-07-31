[![Typing SVG](https://readme-typing-svg.demolab.com?font=Raleway&weight=500&size=50&duration=3000&pause=1000&color=20F700&center=true&vCenter=true&width=640&height=90&lines=Generate+StarkNet+Wallets)](https://git.io/typing-svg)

# StarkNet wallets generator

This code will allow you to generate a specified number of Starknet wallets, deploy it and save them to files.

## Install dependencies
For the code to work, you need to install the following dependencies:
 
- ccxt - 4.0.39
- debug - 4.3.4
- ethers - 5.5.1
- lodash - 4.17.21
- starknet - 4.22.0

You can install it using:
```
npm i
```

or
```
npm i ccxt@4.0.39 debug@4.3.4 ethers@5.5.1 lodash@4.17.21 starknet@4.22.0
```

## Wallet generator

In config.js set:
1. `wallet = argent` or `braavos`, depends on wallet you need to generate
2. `generate = true`
3. `numWallets = N` you want to generate.


## Saving to files

Generated wallets are saved in several files:

- wallets.csv: a CSV file (.csv) containing a list of wallets with addresses, private keys, public keys, and seed phrases.
- seeds.txt: a text file (.txt) listing the LED phrases of each wallet.
- addresses.txt: a text file (.txt) listing the addresses of each wallet.
- private_keys.txt: a text file (.txt) listing the private keys of each wallet.
- public_keys.txt: a text file (.txt) listing the public keys of each wallet.

## Deploying wallets

To deploy wallets, in config.js set:
1. `deploy = true`
2. `delay`
3. `num_deployers`
4. Fill all the OKX settings.

For deploy, soft withdraws ETH from OKX and waits for a deposit in wallet. After that, the wallet is deployed in the blockchain

## Conclusion
```
git clone https://github.com/SYBIL-MAFIA/generate-starknet-wallets.git
cd generate-starknet-wallets
npm i
open config.js
node index.js
```

### Support / Qs

`Telegram:` https://t.me/retrodropTools | https://t.me/fraggdiller
