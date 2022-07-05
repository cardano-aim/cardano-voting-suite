export interface ICardanoWallet {
  icon: string;
  name: string;
  isEnabled: () => Promise<boolean>;
  enable: () => Promise<ICardanoWalletAPI>;
}

export interface ICardanoWalletAPI {
  getNetworkId: () => Promise<number>;
  getUsedAddresses: () => Promise<string[]>;
  signData: (addressCbor: string, payload: string) => Promise<ISignDataResult>;
}

export interface ISignDataResult {
  success: boolean;
  signedData: string;
}
