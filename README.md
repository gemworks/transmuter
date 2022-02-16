# Transmuter ⚗️

Simple program to mutate old NFTs into new.

Install dependencies:
```
yarn
```

Build the program:
```
yarn build
```

Run tests (auto builds):
```
yarn test
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