import { IEpochPoolDelegation, IPoolDelegation } from './types';

export function poolDelegationsByEpoch(
  poolDelegations: IPoolDelegation[],
  lastTakenEpoch: number,
  takenEpochsQuantity: number,
): IEpochPoolDelegation[] {
  const epochs = Array.from(Array(takenEpochsQuantity).keys()).map(
    (k) => k + lastTakenEpoch - (takenEpochsQuantity - 1),
  );
  return epochs.map((epoch) => {
    const delegation = poolDelegations.find((d) => d.epoch_no === epoch);
    const amount = delegation ? delegation.amount : null;
    return { epoch, amount };
  });
}
