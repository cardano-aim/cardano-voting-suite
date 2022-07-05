import { CustomError } from 'ts-custom-error';

export class MissedNetworkId extends CustomError {
  constructor() {
    super('Missed network id');
  }
}

export class UnknownNetworkId extends CustomError {
  constructor(networkId: number) {
    super(`Unknown network id "${networkId}"`);
  }
}

export class StakeAddressEmptyResponse extends CustomError {
  constructor() {
    super('Getting stake address returned empty response');
  }
}

export class CurrentEpochEmptyResponse extends CustomError {
  constructor() {
    super('Getting current epoch returned empty response');
  }
}

export class PoolIdEmptyResponse extends CustomError {
  constructor() {
    super('Getting pool id returned empty response');
  }
}
