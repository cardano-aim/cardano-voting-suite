# cardano-voting-suite

## Initialization

```javascript
import { Voting } from 'cardano-voting-suite';

const voting = new Voting({
  /* options */
});
```

## Constructor options

```typescript
interface IVotingOptions {
  poolBech32Id: string;
  addressCborToBech32: (cbor: string) => string;
  compatibleWallets?: string[];
  apiUrls?: ICardanoDBApiUrls;
  strToHex?: (str: string) => string;
}
```

### `options.poolBech32Id: string`

Required. The pool id in BECH32 format, delegation to which will be checked.

### `options.addressCborToBech32: (cbor: string) => string`

Required. To reduce the size of the library build and drop the dependency, the address conversion function is specified through the constructor. The function must return the address in BECH32 format for the given CBOR address.

> example using `@stricahq/typhonjs`:

```javascript
import { utils } from '@stricahq/typhonjs';

const addressCborToBech32 = (cbor) => utils.getAddressFromHex(cbor).getBech32();
```

> example using `@emurgo/cardano-serialization-lib-asmjs`:

```javascript
import { Address } from '@emurgo/cardano-serialization-lib-asmjs';

const addressCborToBech32 = (cbor) => Address.from_bytes(Buffer.from(cbor, 'hex')).to_bech32();
```

### `options.compatibleWallets?: string[]`

An array of compatible wallet names. The names must match the field names of the `window.cardano` object.

> default: `['eternl', 'flint', 'gerowallet', 'nami', 'nufi']`

### `options.apiUrls?: Record<number, string>`

Postgrest APIs address object. The record key represents the cardano network number, the value is the corresponding API url. By default used postgrest API by dandelion.

> default: `{ 0: 'https://postgrest-api.testnet.dandelion.link', 1: 'https://postgrest-api.mainnet.dandelion.link', }`

### `options.strToHex?: (data: string) => string`

A function to convert a string to hexadecimal format for signing voting data. By default used `strToHex` function from `src/converters` module

## `voting` object API

### `voting.availableWallets: string[]`

Returns a list of existing wallets found in the `window.cardano` object

### `voting.detectEnabledWallets(): Promise<string[]>`

An async function returns a list of wallets that were previously connected by checking `await window.cardano[walletName].isEnabled() === true`

### `voting.enableWallet(walletName: string): Promise<void>`

An async function establishes a connection with the user's wallet and prepares internal parameters for sending requests to cardano-db. Should be called when the user decides to connect the wallet to app.

### `voting.getPoolDelegations(lastTakenEpoch: number, takenEpochsQuantity: number): Promise<IPoolDelegation[]>`

An async function returns the amount of delegated ADA for the given epochs. Interface of the returned value:

```typescript
interface IPoolDelegation {
  amount: number; // ada amount
  epoch_no: number; // the epoch number
}
```

It returns only objects with amount > 0. If you want to get a list with an 'empty object' for non-delegated epochs, use `poolDelegationsByEpoch` helper function (see below).

### `voting.validateVotes(stakeAddressId: number, poolBech32Id: string, lastTakenEpoch: number, takenEpochsQuantity: number, votes: IVote[]): Promise<boolean>`

An async function validates votes distribution. It checks connected wallet and reload pool delegations list to be sure that voting power does not exeed. Interface of `vote` used in the last argument:

```typescript
interface IVote {
  amount: number; // gived vote amount in 'ada'
  proposalId?: unknown; // optional proposal id
}
```

### `voting.signVotes(payload: string): Promise<ISignDataResult>`

An async function for signing the voting result. The string passed to the `payload` argument will be converted to hex format using the `strToHex` function passed via constructor options or using the default function. Interface of the returned value:

```typescript
interface ISignDataResult {
  success: boolean;
  signedData: string;
}
```

### `voting.setPoolBech32Id(poolBech32Id: string): Promise<void>`

An async function to reset the pool. It was used for demo purposes and is unlikely to be useful unless there is a need to switch pools.

### `voting.getUsedAddresses(): Promise<string[]>`

An async function returns addresses used by the wallet in CBOR format. Used for getting the wallet stake address.

### `voting.getStakeAddress(): Promise<IStakeAddress>`

An async function returns the wallet stake address. Interface of the returned value:

```typescript
interface IStakeAddress {
  id: number; // stake address database id
  view: string; // stake address in BECH32 format
}
```
