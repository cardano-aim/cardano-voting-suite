import { ICardanoDBApiUrls } from '../cardano';
import { ICardanoWallet } from '../wallet';

export interface IWindowCardano extends Window {
  cardano?: Record<string, ICardanoWallet>;
}

export interface IVotingOptions {
  poolBech32Id: string;
  addressCborToBech32: (cbor: string) => string;
  compatibleWallets?: string[];
  apiUrls?: ICardanoDBApiUrls;
  strToHex?: (data: string) => string;
}

export interface IVote {
  proposalId?: unknown;
  amount: number;
}
