import { IPoolDelegation } from '../cardano';

export function getVotingPower(poolDelegations: IPoolDelegation[]): number {
  return poolDelegations.reduce((sum, { amount }) => sum + amount, 0) / 1_000_000;
}
