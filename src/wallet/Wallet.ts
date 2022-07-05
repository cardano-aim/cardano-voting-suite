import { IWindowCardano } from '../voting';
import { getErrorMessage } from '../utils';
import { WalletConnectionError, DataSignFailed, UnavailableWallet } from './errors';
import { ICardanoWallet, ICardanoWalletAPI, ISignDataResult } from './types';

export class Wallet {
  private _api: ICardanoWalletAPI | null = null;

  constructor(public name: string) {}

  private get window(): IWindowCardano {
    return global.window as IWindowCardano;
  }

  private async getApi(): Promise<ICardanoWalletAPI> {
    if (this._api === null) {
      try {
        this._api = await this.wallet.enable();
      } catch (error) {
        throw new WalletConnectionError(getErrorMessage(error), this.name);
      }
    }
    return this._api;
  }

  get wallet(): ICardanoWallet {
    if (!this.window.cardano || !this.window.cardano[this.name]) {
      throw new UnavailableWallet(this.name);
    }
    return this.window.cardano[this.name];
  }

  get icon(): string {
    return this.wallet.icon;
  }

  async getNetworkId(): Promise<number> {
    const api = await this.getApi();
    return await api.getNetworkId();
  }

  async getUsedAddresses(): Promise<string[]> {
    const api = await this.getApi();
    return await api.getUsedAddresses();
  }

  async signData(addressCbor: string, hexPayload: string): Promise<ISignDataResult> {
    const api = await this.getApi();
    try {
      return await api.signData(addressCbor, hexPayload);
    } catch (error) {
      throw new DataSignFailed(getErrorMessage(error));
    }
  }
}
