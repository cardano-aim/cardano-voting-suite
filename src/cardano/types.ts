export interface ICardanoDBApiUrls {
  [key: number]: string;
}

export interface IStakeAddress {
  id: number;
  view: string;
}

export interface IPoolDelegation {
  amount: number;
  epoch_no: number;
}

export interface IEpochPoolDelegation {
  epoch: number;
  amount: number | null;
}

export type TStakeAddressResponseData = Array<{
  stake_address: IStakeAddress;
}>;

export type TCurrentEpochResponseData = Array<{
  no: number;
}>;

export type TPoolIdResponseData = Array<{
  id: number;
}>;

export type TPoolDelegationsResponseData = Array<IPoolDelegation>;
