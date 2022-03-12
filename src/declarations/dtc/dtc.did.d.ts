import type { Principal } from '@dfinity/principal';
export type AccountIdentifier = Array<number>;
export interface AmountAccepted { 'accepted' : bigint }
export type AssocList = [] | [[[Key, JournalEntry], List]];
export interface Bio {
  'dob' : string,
  'pob' : string,
  'preface' : string,
  'name' : string,
  'dedications' : string,
}
export interface Branch { 'left' : Trie, 'size' : bigint, 'right' : Trie }
export interface EntryKey { 'entryKey' : bigint }
export type Error = { 'TxFailed' : null } |
  { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'AlreadyExists' : null } |
  { 'UserNameTaken' : null } |
  { 'NoInputGiven' : null } |
  { 'InsufficientFunds' : null };
export type Hash = number;
export interface JournalEntry {
  'unlockTime' : bigint,
  'file2MetaData' : {
    'fileName' : string,
    'fileType' : string,
    'lastModified' : bigint,
  },
  'emailThree' : string,
  'date' : string,
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
  'location' : string,
  'entryTitle' : string,
}
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
  'location' : string,
  'entryTitle' : string,
}
export interface Key { 'key' : bigint, 'hash' : Hash }
export interface Leaf { 'size' : bigint, 'keyvals' : AssocList }
export type List = [] | [[[Key, JournalEntry], List]];
export interface ProfileInput {
  'userName' : [] | [string],
  'email' : [] | [string],
}
export type Result = { 'ok' : null } |
  { 'err' : Error };
export type Result_1 = { 'ok' : Trie } |
  { 'err' : Error };
export type Result_2 = {
    'ok' : {
      'userName' : [] | [string],
      'balance' : Tokens,
      'email' : [] | [string],
      'address' : Array<number>,
      'userJournalData' : [Array<[bigint, JournalEntry]>, Bio],
    }
  } |
  { 'err' : Error };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : Error };
export type Result_4 = { 'ok' : Array<number> } |
  { 'err' : Error };
export type Result_5 = { 'ok' : JournalEntry } |
  { 'err' : Error };
export type Result_6 = {
    'ok' : Array<[string, Array<[bigint, JournalEntry]>]>
  } |
  { 'err' : Error };
export type Result_7 = { 'ok' : AmountAccepted } |
  { 'err' : Error };
export interface Tokens { 'e8s' : bigint }
export type Trie = { 'branch' : Branch } |
  { 'leaf' : Leaf } |
  { 'empty' : null };
export interface User {
  'canisterAccount' : () => Promise<AccountIdentifier>,
  'canisterBalance' : () => Promise<Tokens>,
  'create' : () => Promise<Result_7>,
  'createJournalEntryFile' : (
      arg_0: string,
      arg_1: bigint,
      arg_2: Array<number>,
    ) => Promise<Result>,
  'delete' : () => Promise<Result>,
  'getEntriesToBeSent' : () => Promise<Result_6>,
  'readEntry' : (arg_0: EntryKey) => Promise<Result_5>,
  'readEntryFileChunk' : (arg_0: string, arg_1: bigint) => Promise<Result_4>,
  'readEntryFileSize' : (arg_0: string) => Promise<Result_3>,
  'readJournal' : () => Promise<Result_2>,
  'transferICP' : (arg_0: bigint, arg_1: AccountIdentifier) => Promise<Result>,
  'updateBio' : (arg_0: Bio) => Promise<Result>,
  'updateJournalEntry' : (
      arg_0: [] | [EntryKey],
      arg_1: [] | [JournalEntryInput],
    ) => Promise<Result_1>,
  'updateProfile' : (arg_0: ProfileInput) => Promise<Result>,
}
export interface _SERVICE extends User {}
