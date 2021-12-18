import type { Principal } from '@dfinity/principal';
export interface AmountAccepted { 'accepted' : bigint }
export type AssocList = [] | [[[Key, JournalEntry], List]];
export interface Bio {
  'dob' : string,
  'name' : string,
  'biography' : string,
  'birthPlace' : string,
  'siblings' : string,
  'children' : string,
}
export interface Branch { 'left' : Trie, 'size' : bigint, 'right' : Trie }
export interface EntryKey { 'entryKey' : bigint }
export type Error = { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'AlreadyExists' : null } |
  { 'NoInputGiven' : null };
export type Hash = number;
export interface JournalEntry {
  'date' : string,
  'text' : string,
  'lockTime' : string,
  'location' : string,
  'entryTitle' : string,
}
export interface Key { 'key' : bigint, 'hash' : Hash }
export interface Leaf { 'size' : bigint, 'keyvals' : AssocList }
export type List = [] | [[[Key, JournalEntry], List]];
export interface ProfileInput { 'userName' : string }
export type Result = { 'ok' : null } |
  { 'err' : Error };
export type Result_1 = { 'ok' : Trie } |
  { 'err' : Error };
export type Result_2 = { 'ok' : [Array<[bigint, JournalEntry]>, Bio] } |
  { 'err' : Error };
export type Result_3 = { 'ok' : JournalEntry } |
  { 'err' : Error };
export type Result_4 = { 'ok' : AmountAccepted } |
  { 'err' : Error };
export type Trie = { 'branch' : Branch } |
  { 'leaf' : Leaf } |
  { 'empty' : null };
export interface User {
  'create' : (arg_0: ProfileInput) => Promise<Result_4>,
  'createJournalEntryFile' : (
      arg_0: string,
      arg_1: string,
      arg_2: Array<number>,
    ) => Promise<Result>,
  'delete' : () => Promise<Result>,
  'readEntry' : (arg_0: EntryKey) => Promise<Result_3>,
  'readJournal' : () => Promise<Result_2>,
  'updateJournalEntry' : (
      arg_0: [] | [EntryKey],
      arg_1: [] | [JournalEntry],
    ) => Promise<Result_1>,
  'updateProfile' : (arg_0: ProfileInput) => Promise<Result>,
}
export interface _SERVICE extends User {}
