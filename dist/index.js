/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function fixProto(target, prototype) {
  var setPrototypeOf = Object.setPrototypeOf;
  setPrototypeOf ? setPrototypeOf(target, prototype) : target.__proto__ = prototype;
}
function fixStack(target, fn) {
  if (fn === void 0) {
    fn = target.constructor;
  }

  var captureStackTrace = Error.captureStackTrace;
  captureStackTrace && captureStackTrace(target, fn);
}

var __extends = function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } }
    };

    return extendStatics(d, b);
  };

  return function (d, b) {
    extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var CustomError = function (_super) {
  __extends(CustomError, _super);

  function CustomError(message) {
    var _newTarget = this.constructor;

    var _this = _super.call(this, message) || this;

    Object.defineProperty(_this, 'name', {
      value: _newTarget.name,
      enumerable: false,
      configurable: true
    });
    fixProto(_this, _newTarget.prototype);
    fixStack(_this);
    return _this;
  }

  return CustomError;
}(Error);

class MissedNetworkId extends CustomError {
    constructor() {
        super('Missed network id');
    }
}
class UnknownNetworkId extends CustomError {
    constructor(networkId) {
        super(`Unknown network id "${networkId}"`);
    }
}
class StakeAddressEmptyResponse extends CustomError {
    constructor() {
        super('Getting stake address returned empty response');
    }
}
class CurrentEpochEmptyResponse extends CustomError {
    constructor() {
        super('Getting current epoch returned empty response');
    }
}
class PoolIdEmptyResponse extends CustomError {
    constructor() {
        super('Getting pool id returned empty response');
    }
}

class CardanoDB {
    constructor(apiUrls) {
        this.apiUrls = apiUrls;
        this.networkId = null;
    }
    endpointUrl(path, params, networkId) {
        const _networkId = networkId === undefined ? this.networkId : networkId;
        if (typeof _networkId !== 'number') {
            throw new MissedNetworkId();
        }
        if (!this.apiUrls[_networkId]) {
            throw new UnknownNetworkId(_networkId);
        }
        let url = `${this.apiUrls[_networkId]}/${path}`;
        if (params) {
            url += `?${new URLSearchParams(params)}`;
        }
        return url;
    }
    fetch(path, params, requestInit, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.endpointUrl(path, params, networkId);
            const response = yield fetch(url, requestInit);
            const data = yield response.json();
            return data;
        });
    }
    stakeAddress(usedAddressBech32, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                address: `eq.${usedAddressBech32}`,
                select: 'stake_address(id, view)',
            };
            const data = yield this.fetch('tx_out', params, {}, networkId);
            if (!data.length) {
                throw new StakeAddressEmptyResponse();
            }
            return data[0].stake_address;
        });
    }
    currentEpoch(networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                order: 'no.desc',
                limit: '1',
            };
            const data = yield this.fetch('epoch', params, {}, networkId);
            if (!data.length) {
                throw new CurrentEpochEmptyResponse();
            }
            return data[0].no;
        });
    }
    poolId(poolBech32Id, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                view: `eq.${poolBech32Id}`,
            };
            const data = yield this.fetch('pool_hash', params, {}, networkId);
            if (!data.length) {
                throw new PoolIdEmptyResponse();
            }
            return data[0].id;
        });
    }
    poolDelegations(poolId, addressId, lastTakenEpoch, takenEpochsQuantity, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                pool_id: `eq.${poolId}`,
                addr_id: `eq.${addressId}`,
                and: `(epoch_no.gt.${lastTakenEpoch - takenEpochsQuantity},epoch_no.lte.${lastTakenEpoch})`,
                order: 'epoch_no.asc',
            };
            return yield this.fetch('epoch_stake', params, {}, networkId);
        });
    }
}

function poolDelegationsByEpoch(poolDelegations, lastTakenEpoch, takenEpochsQuantity) {
    const epochs = Array.from(Array(takenEpochsQuantity).keys()).map((k) => k + lastTakenEpoch - (takenEpochsQuantity - 1));
    return epochs.map((epoch) => {
        const delegation = poolDelegations.find((d) => d.epoch_no === epoch);
        const amount = delegation ? delegation.amount : null;
        return { epoch, amount };
    });
}

function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i !== bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}
function strToHex(str) {
    return bytesToHex(new TextEncoder().encode(str));
}
function hexToStr(hex) {
    return new TextDecoder().decode(hexToBytes(hex));
}

function isErrorWithMessage(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string');
}
function toErrorWithMessage(maybeError) {
    if (isErrorWithMessage(maybeError)) {
        return maybeError;
    }
    try {
        return new Error(JSON.stringify(maybeError));
    }
    catch (_a) {
        return new Error(String(maybeError));
    }
}
function getErrorMessage(error) {
    return toErrorWithMessage(error).message;
}

class IncompatibleWallet extends CustomError {
    constructor(walletName) {
        super(`Wallet "${walletName}" is not compatible`);
    }
}
class UnavailableWallet extends CustomError {
    constructor(walletName) {
        super(`Wallet "${walletName}" is not in "window" object`);
    }
}
class WalletConnectionError extends CustomError {
    constructor(message, walletName) {
        super(`Unable to connect wallet "${walletName}": ${message}`);
    }
}
class DataSignFailed extends CustomError {
    constructor(message) {
        super(`Data sign failed: ${message}`);
    }
}

class Wallet {
    constructor(name) {
        this.name = name;
        this._api = null;
    }
    get window() {
        return global.window;
    }
    getApi() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._api === null) {
                try {
                    this._api = yield this.wallet.enable();
                }
                catch (error) {
                    throw new WalletConnectionError(getErrorMessage(error), this.name);
                }
            }
            return this._api;
        });
    }
    get wallet() {
        if (!this.window.cardano || !this.window.cardano[this.name]) {
            throw new UnavailableWallet(this.name);
        }
        return this.window.cardano[this.name];
    }
    get icon() {
        return this.wallet.icon;
    }
    getNetworkId() {
        return __awaiter(this, void 0, void 0, function* () {
            const api = yield this.getApi();
            return yield api.getNetworkId();
        });
    }
    getUsedAddresses() {
        return __awaiter(this, void 0, void 0, function* () {
            const api = yield this.getApi();
            return yield api.getUsedAddresses();
        });
    }
    signData(addressCbor, hexPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            const api = yield this.getApi();
            try {
                return yield api.signData(addressCbor, hexPayload);
            }
            catch (error) {
                throw new DataSignFailed(getErrorMessage(error));
            }
        });
    }
}

class NoCardanoWallets extends CustomError {
    constructor() {
        super('No Cardano wallets found in "window" object');
    }
}
class NoCompatibleWallets extends CustomError {
    constructor() {
        super('Сompatible wallets not found');
    }
}
class NoConnectedWallet extends CustomError {
    constructor() {
        super('The wallet was not connected');
    }
}
class NoUsedAddresses extends CustomError {
    constructor() {
        super('No used addresses in wallet');
    }
}
class MissedPoolId extends CustomError {
    constructor() {
        super('Missed pool id');
    }
}
class MissedStakeAddress extends CustomError {
    constructor() {
        super('Missed stake adderess');
    }
}
class StakeAddressMismatch extends CustomError {
    constructor() {
        super('Stake adderess mismatch');
    }
}
class PoolAddressMismatch extends CustomError {
    constructor() {
        super('Pool adderess mismatch');
    }
}
class CurrentEpochHasChanged extends CustomError {
    constructor() {
        super('Current epoch has changed');
    }
}
class VotingPowerExcess extends CustomError {
    constructor() {
        super('Voting power excess');
    }
}
class NoVotesGiven extends CustomError {
    constructor() {
        super('No votes given');
    }
}

function getVotingPower(poolDelegations) {
    return poolDelegations.reduce((sum, { amount }) => sum + amount, 0) / 1000000;
}

const defaultCompatibleWallets = ['eternl', 'flint', 'gerowallet', 'nami', 'nufi'];
const defaultApiUrls = {
    0: 'https://postgrest-api.testnet.dandelion.link',
    1: 'https://postgrest-api.mainnet.dandelion.link',
};
class Voting {
    constructor(options) {
        this.poolId = null;
        this.stakeAddress = null;
        this.currentEpoch = null;
        this._wallet = null;
        this.compatibleWallets = options.compatibleWallets || defaultCompatibleWallets;
        this.poolBech32Id = options.poolBech32Id;
        this.cardanoDB = new CardanoDB(options.apiUrls || defaultApiUrls);
        this.addressCborToBech32 = options.addressCborToBech32;
        this.strToHex = options.strToHex || strToHex;
    }
    get window() {
        return global.window;
    }
    get wallet() {
        if (!this._wallet) {
            throw new NoConnectedWallet();
        }
        return this._wallet;
    }
    set wallet(wallet) {
        this._wallet = wallet;
    }
    get availableWallets() {
        if (!this.window.cardano) {
            throw new NoCardanoWallets();
        }
        const availableWallets = Object.keys(this.window.cardano).filter((key) => this.compatibleWallets.includes(key));
        if (availableWallets.length === 0) {
            throw new NoCompatibleWallets();
        }
        return availableWallets;
    }
    detectEnabledWallets() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.window.cardano) {
                throw new NoCardanoWallets();
            }
            const enabledWallets = [];
            if (this.window.cardano) {
                for (const walletName of this.availableWallets) {
                    const isEnabled = yield this.window.cardano[walletName].isEnabled();
                    if (isEnabled) {
                        enabledWallets.push(walletName);
                    }
                }
            }
            return enabledWallets;
        });
    }
    getUsedAddresses() {
        return __awaiter(this, void 0, void 0, function* () {
            const usedAddresses = yield this.wallet.getUsedAddresses();
            if (!usedAddresses.length) {
                throw new NoUsedAddresses();
            }
            return usedAddresses;
        });
    }
    getStakeAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            const usedAddresses = yield this.getUsedAddresses();
            const usedAddressCbor = usedAddresses[0];
            const usedAddressBech32 = this.addressCborToBech32(usedAddressCbor);
            return yield this.cardanoDB.stakeAddress(usedAddressBech32);
        });
    }
    enableWallet(walletName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.wallet = new Wallet(walletName);
            this.cardanoDB.networkId = yield this.wallet.getNetworkId();
            this.stakeAddress = yield this.getStakeAddress();
            this.poolId = yield this.cardanoDB.poolId(this.poolBech32Id);
            this.currentEpoch = yield this.cardanoDB.currentEpoch();
        });
    }
    // ????
    setPoolBech32Id(poolBech32Id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.poolBech32Id = poolBech32Id;
            const poolId = yield this.cardanoDB.poolId(poolBech32Id);
            this.poolId = poolId;
        });
    }
    getPoolDelegations(lastTakenEpoch, takenEpochsQuantity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.stakeAddress) {
                throw new MissedStakeAddress();
            }
            if (!this.poolId) {
                throw new MissedPoolId();
            }
            const poolDelegations = yield this.cardanoDB.poolDelegations(this.poolId, this.stakeAddress.id, lastTakenEpoch, takenEpochsQuantity);
            return poolDelegations;
        });
    }
    validateVotes(stakeAddressId, poolBech32Id, lastTakenEpoch, takenEpochsQuantity, votes) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const votesAmountSum = votes.reduce((acc, { amount }) => (acc += amount), 0);
            // check there is at least one vote
            if (votesAmountSum === 0) {
                throw new NoVotesGiven();
            }
            // check wallet has used address
            const usedAddresses = yield this.getUsedAddresses();
            // check wallet stake address didn't change
            const usedAddressCbor = usedAddresses[0];
            const usedAddressBech32 = this.addressCborToBech32(usedAddressCbor);
            const stakeAddress = yield this.cardanoDB.stakeAddress(usedAddressBech32);
            if (stakeAddressId !== stakeAddress.id || stakeAddressId !== ((_a = this.stakeAddress) === null || _a === void 0 ? void 0 : _a.id)) {
                throw new StakeAddressMismatch();
            }
            // check pool didn't change
            if (poolBech32Id !== this.poolBech32Id) {
                throw new PoolAddressMismatch();
            }
            // check current epoch hasn't changed
            const currentEpoch = yield this.cardanoDB.currentEpoch();
            if (currentEpoch !== this.currentEpoch) {
                throw new CurrentEpochHasChanged();
            }
            // refresh voting power
            const poolDelegations = yield this.getPoolDelegations(lastTakenEpoch, takenEpochsQuantity);
            const votingPower = getVotingPower(poolDelegations);
            // check single vote amount hasn't exceed voting power
            for (const vote of votes) {
                if (vote.amount > votingPower) {
                    throw new VotingPowerExcess();
                }
            }
            // check votes amount sum hasn't exceed voting power
            if (votesAmountSum > votingPower) {
                throw new VotingPowerExcess();
            }
            // all checks passed
            return true;
        });
    }
    signVotes(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const usedAddresses = yield this.getUsedAddresses();
            const hexPayload = this.strToHex(payload);
            return yield this.wallet.signData(usedAddresses[0], hexPayload);
        });
    }
}

export { CardanoDB, CurrentEpochEmptyResponse, CurrentEpochHasChanged, DataSignFailed, IncompatibleWallet, MissedNetworkId, MissedPoolId, MissedStakeAddress, NoCardanoWallets, NoCompatibleWallets, NoConnectedWallet, NoUsedAddresses, NoVotesGiven, PoolAddressMismatch, PoolIdEmptyResponse, StakeAddressEmptyResponse, StakeAddressMismatch, UnavailableWallet, UnknownNetworkId, Voting, VotingPowerExcess, Wallet, WalletConnectionError, getVotingPower, hexToStr, poolDelegationsByEpoch, strToHex };
//# sourceMappingURL=index.js.map
