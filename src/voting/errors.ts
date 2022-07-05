import { CustomError } from 'ts-custom-error';

export class NoCardanoWallets extends CustomError {
  constructor() {
    super('No Cardano wallets found in "window" object');
  }
}

export class NoCompatibleWallets extends CustomError {
  constructor() {
    super('Сompatible wallets not found');
  }
}

export class NoConnectedWallet extends CustomError {
  constructor() {
    super('The wallet was not connected');
  }
}

export class NoUsedAddresses extends CustomError {
  constructor() {
    super('No used addresses in wallet');
  }
}

export class MissedPoolId extends CustomError {
  constructor() {
    super('Missed pool id');
  }
}

export class MissedStakeAddress extends CustomError {
  constructor() {
    super('Missed stake adderess');
  }
}

export class StakeAddressMismatch extends CustomError {
  constructor() {
    super('Stake adderess mismatch');
  }
}

export class PoolAddressMismatch extends CustomError {
  constructor() {
    super('Pool adderess mismatch');
  }
}

export class CurrentEpochHasChanged extends CustomError {
  constructor() {
    super('Current epoch has changed');
  }
}

export class VotingPowerExcess extends CustomError {
  constructor() {
    super('Voting power excess');
  }
}

export class NoVotesGiven extends CustomError {
  constructor() {
    super('No votes given');
  }
}
