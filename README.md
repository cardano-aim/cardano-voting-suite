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

To reduce the size of the library build and drop the dependency, the address conversion function is specified through the constructor. The function must be called with address CBOR as argument and return the address in BECH32 format.

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
