import { CustomError } from 'ts-custom-error';

interface ICardanoDBApiUrls {
    [key: number]: string;
}
interface IStakeAddress {
    id: number;
    view: string;
}
interface IPoolDelegation {
    amount: number;
    epoch_no: number;
}
interface IEpochPoolDelegation {
    epoch: number;
    amount: number | null;
}
declare type TStakeAddressResponseData = Array<{
    stake_address: IStakeAddress;
}>;
declare type TCurrentEpochResponseData = Array<{
    no: number;
}>;
declare type TPoolIdResponseData = Array<{
    id: number;
}>;
declare type TPoolDelegationsResponseData = Array<IPoolDelegation>;

declare class CardanoDB {
    protected apiUrls: ICardanoDBApiUrls;
    networkId: number | null;
    constructor(apiUrls: ICardanoDBApiUrls);
    protected endpointUrl(path: string, params?: Record<string, string>, networkId?: number): string;
    protected fetch<ResponseData>(path: string, params: Record<string, string>, requestInit?: RequestInit, networkId?: number): Promise<ResponseData>;
    stakeAddress(usedAddressBech32: string, networkId?: number): Promise<IStakeAddress>;
    currentEpoch(networkId?: number): Promise<number>;
    poolId(poolBech32Id: string, networkId?: number): Promise<number>;
    poolDelegations(poolId: number, addressId: number, lastTakenEpoch: number, takenEpochsQuantity: number, networkId?: number): Promise<TPoolDelegationsResponseData>;
}

declare class MissedNetworkId extends CustomError {
    constructor();
}
declare class UnknownNetworkId extends CustomError {
    constructor(networkId: number);
}
declare class StakeAddressEmptyResponse extends CustomError {
    constructor();
}
declare class CurrentEpochEmptyResponse extends CustomError {
    constructor();
}
declare class PoolIdEmptyResponse extends CustomError {
    constructor();
}

declare function poolDelegationsByEpoch(poolDelegations: IPoolDelegation[], lastTakenEpoch: number, takenEpochsQuantity: number): IEpochPoolDelegation[];

interface ICardanoWallet {
    icon: string;
    name: string;
    isEnabled: () => Promise<boolean>;
    enable: () => Promise<ICardanoWalletAPI>;
}
interface ICardanoWalletAPI {
    getNetworkId: () => Promise<number>;
    getUsedAddresses: () => Promise<string[]>;
    signData: (addressCbor: string, payload: string) => Promise<ISignDataResult>;
}
interface ISignDataResult {
    success: boolean;
    signedData: string;
}

declare class Wallet {
    name: string;
    private _api;
    constructor(name: string);
    private get window();
    private getApi;
    get wallet(): ICardanoWallet;
    get icon(): string;
    getNetworkId(): Promise<number>;
    getUsedAddresses(): Promise<string[]>;
    signData(addressCbor: string, hexPayload: string): Promise<ISignDataResult>;
}

declare class IncompatibleWallet extends CustomError {
    constructor(walletName: string);
}
declare class UnavailableWallet extends CustomError {
    constructor(walletName: string);
}
declare class WalletConnectionError extends CustomError {
    constructor(message: string, walletName: string);
}
declare class DataSignFailed extends CustomError {
    constructor(message: string);
}

interface IWindowCardano extends Window {
    cardano?: Record<string, ICardanoWallet>;
}
interface IVotingOptions {
    poolBech32Id: string;
    addressCborToBech32: (cbor: string) => string;
    compatibleWallets?: string[];
    apiUrls?: ICardanoDBApiUrls;
    strToHex?: (data: string) => string;
}
interface IVote {
    proposalId: string;
    amount: number;
}

declare class Voting {
    compatibleWallets: string[];
    poolBech32Id: string;
    cardanoDB: CardanoDB;
    addressCborToBech32: (cbor: string) => string;
    strToHex: (data: string) => string;
    poolId: number | null;
    stakeAddress: IStakeAddress | null;
    currentEpoch: number | null;
    private _wallet;
    constructor(options: IVotingOptions);
    private get window();
    private get wallet();
    private set wallet(value);
    get availableWallets(): string[];
    detectEnabledWallets(): Promise<string[]>;
    getUsedAddresses(): Promise<string[]>;
    getStakeAddress(): Promise<IStakeAddress>;
    enableWallet(walletName: string): Promise<void>;
    setPoolBech32Id(poolBech32Id: string): Promise<void>;
    getPoolDelegations(lastTakenEpoch: number, takenEpochsQuantity: number): Promise<IPoolDelegation[]>;
    validateVotes(stakeAddressId: number, poolBech32Id: string, lastTakenEpoch: number, takenEpochsQuantity: number, votes: IVote[]): Promise<boolean>;
    signVotes(payload: string): Promise<ISignDataResult>;
}

declare class NoCardanoWallets extends CustomError {
    constructor();
}
declare class NoCompatibleWallets extends CustomError {
    constructor();
}
declare class NoConnectedWallet extends CustomError {
    constructor();
}
declare class NoUsedAddresses extends CustomError {
    constructor();
}
declare class MissedPoolId extends CustomError {
    constructor();
}
declare class MissedStakeAddress extends CustomError {
    constructor();
}
declare class StakeAddressMismatch extends CustomError {
    constructor();
}
declare class PoolAddressMismatch extends CustomError {
    constructor();
}
declare class CurrentEpochHasChanged extends CustomError {
    constructor();
}
declare class VotingPowerExcess extends CustomError {
    constructor();
}
declare class NoVotesGiven extends CustomError {
    constructor();
}

declare function getVotingPower(poolDelegations: IPoolDelegation[]): number;

declare function strToHex(str: string): string;
declare function hexToStr(hex: string): string;

export { CardanoDB, CurrentEpochEmptyResponse, CurrentEpochHasChanged, DataSignFailed, ICardanoDBApiUrls, ICardanoWallet, ICardanoWalletAPI, IEpochPoolDelegation, IPoolDelegation, ISignDataResult, IStakeAddress, IVote, IVotingOptions, IWindowCardano, IncompatibleWallet, MissedNetworkId, MissedPoolId, MissedStakeAddress, NoCardanoWallets, NoCompatibleWallets, NoConnectedWallet, NoUsedAddresses, NoVotesGiven, PoolAddressMismatch, PoolIdEmptyResponse, StakeAddressEmptyResponse, StakeAddressMismatch, TCurrentEpochResponseData, TPoolDelegationsResponseData, TPoolIdResponseData, TStakeAddressResponseData, UnavailableWallet, UnknownNetworkId, Voting, VotingPowerExcess, Wallet, WalletConnectionError, getVotingPower, hexToStr, poolDelegationsByEpoch, strToHex };
