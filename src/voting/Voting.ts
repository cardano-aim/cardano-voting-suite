import { CardanoDB, IPoolDelegation, IStakeAddress } from '../cardano';
import { strToHex } from '../converters';
import { ISignDataResult, Wallet } from '../wallet';
import {
  CurrentEpochHasChanged,
  MissedPoolId,
  MissedStakeAddress,
  NoCardanoWallets,
  NoCompatibleWallets,
  NoConnectedWallet,
  NoUsedAddresses,
  NoVotesGiven,
  PoolAddressMismatch,
  StakeAddressMismatch,
  VotingPowerExcess,
} from './errors';
import { IVote, IVotingOptions, IWindowCardano } from './types';
import { getVotingPower } from './utils';

const defaultCompatibleWallets = ['eternl', 'flint', 'gerowallet', 'nami', 'nufi'];
const defaultApiUrls = {
  0: 'https://postgrest-api.testnet.dandelion.link',
  1: 'https://postgrest-api.mainnet.dandelion.link',
};

export class Voting {
  compatibleWallets: string[];
  poolBech32Id: string;
  cardanoDB: CardanoDB;
  addressCborToBech32: (cbor: string) => string;
  strToHex: (data: string) => string;

  poolId: number | null = null;
  stakeAddress: IStakeAddress | null = null;
  currentEpoch: number | null = null;

  private _wallet: Wallet | null = null;

  constructor(options: IVotingOptions) {
    this.compatibleWallets = options.compatibleWallets || defaultCompatibleWallets;
    this.poolBech32Id = options.poolBech32Id;
    this.cardanoDB = new CardanoDB(options.apiUrls || defaultApiUrls);
    this.addressCborToBech32 = options.addressCborToBech32;
    this.strToHex = options.strToHex || strToHex;
  }

  private get window(): IWindowCardano {
    return global.window as IWindowCardano;
  }

  private get wallet(): Wallet {
    if (!this._wallet) {
      throw new NoConnectedWallet();
    }
    return this._wallet;
  }

  private set wallet(wallet: Wallet) {
    this._wallet = wallet;
  }

  get availableWallets(): string[] {
    if (!this.window.cardano) {
      throw new NoCardanoWallets();
    }
    const availableWallets = Object.keys(this.window.cardano).filter((key) =>
      this.compatibleWallets.includes(key),
    );
    if (availableWallets.length === 0) {
      throw new NoCompatibleWallets();
    }
    return availableWallets;
  }

  async detectEnabledWallets(): Promise<string[]> {
    if (!this.window.cardano) {
      throw new NoCardanoWallets();
    }
    const enabledWallets: string[] = [];
    if (this.window.cardano) {
      for (const walletName of this.availableWallets) {
        const isEnabled = await this.window.cardano[walletName].isEnabled();
        if (isEnabled) {
          enabledWallets.push(walletName);
        }
      }
    }
    return enabledWallets;
  }

  async getUsedAddresses(): Promise<string[]> {
    const usedAddresses = await this.wallet.getUsedAddresses();
    if (!usedAddresses.length) {
      throw new NoUsedAddresses();
    }
    return usedAddresses;
  }

  async getStakeAddress(): Promise<IStakeAddress> {
    const usedAddresses = await this.getUsedAddresses();
    const usedAddressCbor = usedAddresses[0];
    const usedAddressBech32 = this.addressCborToBech32(usedAddressCbor);
    return await this.cardanoDB.stakeAddress(usedAddressBech32);
  }

  async enableWallet(walletName: string): Promise<void> {
    this.wallet = new Wallet(walletName);

    this.cardanoDB.networkId = await this.wallet.getNetworkId();
    this.stakeAddress = await this.getStakeAddress();
    this.poolId = await this.cardanoDB.poolId(this.poolBech32Id);
    this.currentEpoch = await this.cardanoDB.currentEpoch();
  }

  // ????
  async setPoolBech32Id(poolBech32Id: string): Promise<void> {
    this.poolBech32Id = poolBech32Id;
    const poolId = await this.cardanoDB.poolId(poolBech32Id);
    this.poolId = poolId;
  }

  async getPoolDelegations(lastTakenEpoch: number, takenEpochsQuantity: number): Promise<IPoolDelegation[]> {
    if (!this.stakeAddress) {
      throw new MissedStakeAddress();
    }
    if (!this.poolId) {
      throw new MissedPoolId();
    }

    const poolDelegations = await this.cardanoDB.poolDelegations(
      this.poolId,
      this.stakeAddress.id,
      lastTakenEpoch,
      takenEpochsQuantity,
    );

    return poolDelegations;
  }

  async validateVotes(
    stakeAddressId: number,
    poolBech32Id: string,
    lastTakenEpoch: number,
    takenEpochsQuantity: number,
    votes: IVote[],
  ): Promise<boolean> {
    const votesAmountSum = votes.reduce((acc, { amount }) => (acc += amount), 0);

    // check there is at least one vote
    if (votesAmountSum === 0) {
      throw new NoVotesGiven();
    }

    // check wallet has used address
    const usedAddresses = await this.getUsedAddresses();

    // check wallet stake address didn't change
    const usedAddressCbor = usedAddresses[0];
    const usedAddressBech32 = this.addressCborToBech32(usedAddressCbor);
    const stakeAddress = await this.cardanoDB.stakeAddress(usedAddressBech32);
    if (stakeAddressId !== stakeAddress.id || stakeAddressId !== this.stakeAddress?.id) {
      throw new StakeAddressMismatch();
    }

    // check pool didn't change
    if (poolBech32Id !== this.poolBech32Id) {
      throw new PoolAddressMismatch();
    }

    // check current epoch hasn't changed
    const currentEpoch = await this.cardanoDB.currentEpoch();
    if (currentEpoch !== this.currentEpoch) {
      throw new CurrentEpochHasChanged();
    }

    // refresh voting power
    const poolDelegations = await this.getPoolDelegations(lastTakenEpoch, takenEpochsQuantity);
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
  }

  async signVotes(payload: string): Promise<ISignDataResult> {
    const usedAddresses = await this.getUsedAddresses();
    const hexPayload = this.strToHex(payload);
    return await this.wallet.signData(usedAddresses[0], hexPayload);
  }
}
