# Transmuter ⚗️

Simple program to mutate old NFTs into new.

## Docs

Read full documentation [here](https://docs.gemworks.gg/transmuter/overview).

## Official deployment

Transmuter is officially deployed at: `muto7o7vvfXcvpy5Qgjtaog7GRhtr9Zpzn7PSCmmF8Z` across all 3: mainnet, devnet, testnet.

## Deploying / using

Install dependencies:
```
yarn
```

Build the program:
```
yarn build
```

Run tests:
```
# localnet
yarn test

# devnet
anchor test --skip-deploy --provider.cluster devnet --provider.wallet <WALLET>
```

Publish new SDK to NPM:
```
yarn pub
```

Pull latest `gem-farm-ts` from NPM:
```
yarn update
```

Deploy:
```
anchor deploy --provider.cluster devnet --provider.wallet <WALLET>
anchor deploy --provider.cluster testnet --provider.wallet <WALLET>
anchor deploy --provider.cluster mainnet --provider.wallet <WALLET>

#note - w/o the --provider.wallet it will deploy using the KP in the /tests folder, which is obviously leaked
```