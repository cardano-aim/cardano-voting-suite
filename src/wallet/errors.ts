import { CustomError } from 'ts-custom-error';

export class IncompatibleWallet extends CustomError {
  constructor(walletName: string) {
    super(`Wallet "${walletName}" is not compatible`);
  }
}

export class UnavailableWallet extends CustomError {
  constructor(walletName: string) {
    super(`Wallet "${walletName}" is not in "window" object`);
  }
}

export class WalletConnectionError extends CustomError {
  constructor(message: string, walletName: string) {
    super(`Unable to connect wallet "${walletName}": ${message}`);
  }
}

export class DataSignFailed extends CustomError {
  constructor(message: string) {
    super(`Data sign failed: ${message}`);
  }
}
