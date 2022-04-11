import type { Principal } from '@dfinity/principal';
export type AccountIdentifier = Array<number>;
export interface AmountAccepted { 'accepted' : bigint }
export type AssocList = [] | [[[Key, JournalEntryV2], List]];
export interface Bio {
  'dob' : string,
  'pob' : string,
  'preface' : string,
  'name' : string,
  'dedications' : string,
}
export interface Branch { 'left' : Trie, 'size' : bigint, 'right' : Trie }
export interface EntryKey { 'entryKey' : bigint }
export type Error = { 'WalletBalanceTooLow' : null } |
  { 'TxFailed' : null } |
  { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'AlreadyExists' : null } |
  { 'UserNameTaken' : null } |
  { 'NoInputGiven' : null } |
  { 'InsufficientFunds' : null };
export type Hash = number;
export interface ICP { 'e8s' : bigint }
export interface JournalEntryInput {
  'file2MetaData' : {
    'fileName' : string,
    'fileType' : string,
    'lastModified' : bigint,
  },
  'emailThree' : string,
  'date' : string,
  'text' : string,
  'file1MetaData' : {
    'fileName' : string,
    'fileType' : string,
    'lastModified' : bigint,
  },
  'lockTime' : bigint,
  'emailOne' : string,
  'emailTwo' : string,
  'draft' : boolean,
  'location' : string,
  'entryTitle' : string,
}
export interface JournalEntryV2 {
  'unlockTime' : bigint,
  'file2MetaData' : {
    'fileName' : string,
    'fileType' : string,
    'lastModified' : bigint,
  },
  'emailThree' : string,
  'date' : string,
  'read' : boolean,
  'sent' : boolean,
  'text' : string,
  'file1MetaData' : {
    'fileName' : string,
    'fileType' : string,
    'lastModified' : bigint,
  },
  'lockTime' : bigint,
  'emailOne' : string,
  'emailTwo' : string,
  'draft' : boolean,
  'location' : string,
  'entryTitle' : string,
}
export interface Key { 'key' : bigint, 'hash' : Hash }
export interface Leaf { 'size' : bigint, 'keyvals' : AssocList }
export type List = [] | [[[Key, JournalEntryV2], List]];
export interface ProfileInput {
  'userName' : [] | [string],
  'email' : [] | [string],
}
export type Result = { 'ok' : null } |
  { 'err' : Error };
export type Result_1 = { 'ok' : Trie } |
  { 'err' : Error };
export type Result_2 = { 'ok' : [bigint, Array<bigint>] } |
  { 'err' : Error };
export type Result_3 = {
    'ok' : {
      'userName' : [] | [string],
      'balance' : ICP,
      'email' : [] | [string],
      'address' : Array<number>,
      'userJournalData' : [Array<[bigint, JournalEntryV2]>, Bio],
    }
  } |
  { 'err' : Error };
export type Result_4 = { 'ok' : bigint } |
  { 'err' : Error };
export type Result_5 = { 'ok' : Array<number> } |
  { 'err' : Error };
export type Result_6 = { 'ok' : JournalEntryV2 } |
  { 'err' : Error };
export type Result_7 = {
    'ok' : Array<[string, Array<[bigint, JournalEntryV2]>]>
  } |
  { 'err' : Error };
export type Result_8 = { 'ok' : AmountAccepted } |
  { 'err' : Error };
export type Trie = { 'branch' : Branch } |
  { 'leaf' : Leaf } |
  { 'empty' : null };
export interface User {
  'canisterAccount' : () => Promise<AccountIdentifier>,
  'canisterBalance' : () => Promise<ICP>,
  'create' : () => Promise<Result_8>,
  'createJournalEntryFile' : (
      arg_0: string,
      arg_1: bigint,
      arg_2: Array<number>,
    ) => Promise<Result>,
  'delete' : () => Promise<Result>,
  'getEntriesToBeSent' : () => Promise<Result_7>,
  'getProfilesSize' : () => Promise<bigint>,
  'getTotalValueLocked' : () => Promise<bigint>,
  'mainCanisterCyclesBalance' : () => Promise<bigint>,
  'readEntry' : (arg_0: EntryKey) => Promise<Result_6>,
  'readEntryFileChunk' : (arg_0: string, arg_1: bigint) => Promise<Result_5>,
  'readEntryFileSize' : (arg_0: string) => Promise<Result_4>,
  'readJournal' : () => Promise<Result_3>,
  'refillCanisterCycles' : () => Promise<Result_2>,
  'transferICP' : (arg_0: bigint, arg_1: AccountIdentifier) => Promise<Result>,
  'updateBio' : (arg_0: Bio) => Promise<Result>,
  'updateJournalEntry' : (
      arg_0: [] | [EntryKey],
      arg_1: [] | [JournalEntryInput],
    ) => Promise<Result_1>,
  'updateProfile' : (arg_0: ProfileInput) => Promise<Result>,
  'wallet_receive' : () => Promise<{ 'accepted' : bigint }>,
}
export interface _SERVICE extends User {}
