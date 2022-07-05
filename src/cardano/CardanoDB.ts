import {
  MissedNetworkId,
  UnknownNetworkId,
  StakeAddressEmptyResponse,
  CurrentEpochEmptyResponse,
  PoolIdEmptyResponse,
} from './errors';
import {
  ICardanoDBApiUrls,
  IStakeAddress,
  TStakeAddressResponseData,
  TCurrentEpochResponseData,
  TPoolIdResponseData,
  TPoolDelegationsResponseData,
} from './types';

export class CardanoDB {
  networkId: number | null = null;

  constructor(protected apiUrls: ICardanoDBApiUrls) {}

  protected endpointUrl(path: string, params?: Record<string, string>, networkId?: number): string {
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

  protected async fetch<ResponseData>(
    path: string,
    params: Record<string, string>,
    requestInit?: RequestInit,
    networkId?: number,
  ): Promise<ResponseData> {
    const url = this.endpointUrl(path, params, networkId);
    const response = await fetch(url, requestInit);
    const data = await response.json();
    return data as ResponseData;
  }

  async stakeAddress(usedAddressBech32: string, networkId?: number): Promise<IStakeAddress> {
    const params = {
      address: `eq.${usedAddressBech32}`,
      select: 'stake_address(id, view)',
    };
    const data = await this.fetch<TStakeAddressResponseData>('tx_out', params, {}, networkId);
    if (!data.length) {
      throw new StakeAddressEmptyResponse();
    }
    return data[0].stake_address;
  }

  async currentEpoch(networkId?: number): Promise<number> {
    const params = {
      order: 'no.desc',
      limit: '1',
    };
    const data = await this.fetch<TCurrentEpochResponseData>('epoch', params, {}, networkId);
    if (!data.length) {
      throw new CurrentEpochEmptyResponse();
    }
    return data[0].no as number;
  }

  async poolId(poolBech32Id: string, networkId?: number): Promise<number> {
    const params = {
      view: `eq.${poolBech32Id}`,
    };
    const data = await this.fetch<TPoolIdResponseData>('pool_hash', params, {}, networkId);
    if (!data.length) {
      throw new PoolIdEmptyResponse();
    }
    return data[0].id as number;
  }

  async poolDelegations(
    poolId: number,
    addressId: number,
    lastTakenEpoch: number,
    takenEpochsQuantity: number,
    networkId?: number,
  ): Promise<TPoolDelegationsResponseData> {
    const params = {
      pool_id: `eq.${poolId}`,
      addr_id: `eq.${addressId}`,
      and: `(epoch_no.gt.${lastTakenEpoch - takenEpochsQuantity},epoch_no.lte.${lastTakenEpoch})`,
      order: 'epoch_no.asc',
    };
    return await this.fetch<TPoolDelegationsResponseData>('epoch_stake', params, {}, networkId);
  }
}
