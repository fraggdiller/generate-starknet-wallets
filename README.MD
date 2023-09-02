[![Typing SVG](https://readme-typing-svg.demolab.com?font=Raleway&weight=500&size=50&duration=3000&pause=1000&color=20F700&center=true&vCenter=true&width=640&height=90&lines=Generate+StarkNet+Wallets)](https://git.io/typing-svg)

# StarkNet wallets generator

This code will allow you to generate a specified number of Starknet wallets, deploy it and save them to files.

## Install dependencies

You can install it using:
```
npm i
```

## Wallet generator

To generate wallets you can run the following command in terminal
```
npm run generate -- argent 10
```
or
```
npm run generate -- braavos 30
```

It runs wallet generator, and saves generated data in `./data/generated.csv`
If you want to regenerate wallets you can run
```
npm run generate -- argent 10 new
```
or
```
npm run generate -- braavos 30 new
```

## Getting data of pregenerated wallets
You can get all wallets' data from mnemonics. You should load your mnemonics to `./data/Mnemonics.txt` and run 
```
npm run data -- argent
```
or
```
npm run data -- braavos
```


## Saving to files

Generated wallets are saved in several files:

- generated.csv: a CSV file (.csv) containing a list of wallets with wallet name, addresses, private keys, and seed phrases.
- wallets.csv: a CSV file (.csv) containing a list of wallets with wallet name, addresses, private keys, and seed phrases, flag is wallet deployed.


## Deploying wallets

To deploy wallets, in config.js set:
1. `delay`
2. `attempts`
3. Fill all the OKX settings.

For deploy, soft withdraws ETH from OKX and waits for a deposit in wallet. After that, the wallet is deployed in the blockchain.

If you already have balance in not deployed Starknet wallets, it's not neccessary to fill OKXAuth settings.

To run deploy enter this command:
```
npm run deploy
```

First of all, it deploys wallets from generated.csv and after that deploys wallets from wallets.csv

To deploy wallets only from wallets.csv you should delete everything except `WalletName,Address,Mnemonic,PrivateKey` and it will deploy wallets.from wallets.csv

### Features
- Before deploy it check is wallet generated or not
- Before deploy it check wallet balance and if it's zero it will withdraw a little more than necessary for deploy

## Conclusion
```
git clone https://github.com/SYBIL-MAFIA/generate-starknet-wallets.git
cd generate-starknet-wallets
npm i
open config.js
npm run generate -- argent 30 new
open Mnemonics.txt
npm run data -- argent
npm run deploy
```

### Support / Qs

`Telegram:` https://t.me/retrodropTools | https://t.me/fraggdiller
 