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
export type Error = { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'AlreadyExists' : null } |
  { 'NoInputGiven' : null };
export type Hash = number;
export interface JournalEntry {
  'unlockTime' : bigint,
  'emailThree' : string,
  'date' : string,
  'sent' : boolean,
  'text' : string,
  'lockTime' : bigint,
  'emailOne' : string,
  'emailTwo' : string,
  'location' : string,
  'entryTitle' : string,
}
export interface JournalEntryInput {
  'emailThree' : string,
  'date' : string,
  'text' : string,
  'lockTime' : bigint,
  'emailOne' : string,
  'emailTwo' : string,
  'location' : string,
  'entryTitle' : string,
}
export interface Key { 'key' : bigint, 'hash' : Hash }
export interface Leaf { 'size' : bigint, 'keyvals' : AssocList }
export type List = [] | [[[Key, JournalEntry], List]];
export interface ProfileInput { 'userName' : string, 'email' : string }
export type Result = { 'ok' : null } |
  { 'err' : Error };
export type Result_1 = { 'ok' : Trie } |
  { 'err' : Error };
export type Result_2 = {
    'ok' : {
      'userName' : string,
      'balance' : Tokens,
      'email' : string,
      'address' : [] | [string],
      'userJournalData' : [Array<[bigint, JournalEntry]>, Bio],
    }
  } |
  { 'err' : Error };
export type Result_3 = { 'ok' : JournalEntry } |
  { 'err' : Error };
export type Result_4 = {
    'ok' : Array<[string, Array<[bigint, JournalEntry]>]>
  } |
  { 'err' : Error };
export type Result_5 = { 'ok' : AmountAccepted } |
  { 'err' : Error };
export interface Tokens { 'e8s' : bigint }
export type Trie = { 'branch' : Branch } |
  { 'leaf' : Leaf } |
  { 'empty' : null };
export interface User {
  'canisterAccount' : () => Promise<AccountIdentifier>,
  'canisterBalance' : () => Promise<Tokens>,
  'create' : (arg_0: ProfileInput) => Promise<Result_5>,
  'createJournalEntryFile' : (
      arg_0: string,
      arg_1: string,
      arg_2: Array<number>,
    ) => Promise<Result>,
  'delete' : () => Promise<Result>,
  'getEntriesToBeSent' : () => Promise<Result_4>,
  'readEntry' : (arg_0: EntryKey) => Promise<Result_3>,
  'readJournal' : () => Promise<Result_2>,
  'transferICP' : (arg_0: bigint) => Promise<Principal>,
  'updateBio' : (arg_0: Bio) => Promise<Result>,
  'updateJournalEntry' : (
      arg_0: [] | [EntryKey],
      arg_1: [] | [JournalEntryInput],
    ) => Promise<Result_1>,
  'updateProfile' : (arg_0: ProfileInput) => Promise<Result>,
}
export interface _SERVICE extends User {}
