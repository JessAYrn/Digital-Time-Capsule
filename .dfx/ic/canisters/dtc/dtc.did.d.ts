import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type AccountIdentifier = Uint8Array;
export interface AmountAccepted { 'accepted' : bigint }
export type ApiError = { 'ZeroAddress' : null } |
  { 'InvalidTokenId' : null } |
  { 'Unauthorized' : null } |
  { 'Other' : null };
export type Approved = boolean;
export interface Bio {
  'dob' : string,
  'pob' : string,
  'preface' : string,
  'name' : string,
  'photos' : Array<FileMetaData>,
  'dedications' : string,
}
export interface CanisterCyclesBalances {
  'frontendCyclesBalance' : bigint,
  'backendCyclesBalance' : bigint,
}
export interface CanisterData {
  'backEndPrincipal' : string,
  'lastRecordedTime' : bigint,
  'acceptingRequests' : boolean,
  'backEndCyclesBurnRatePerDay' : bigint,
  'nftOwner' : string,
  'managerCanisterPrincipal' : string,
  'lastRecordedBackEndCyclesBalance' : bigint,
  'nftId' : bigint,
  'frontEndPrincipal' : string,
}
export interface CanisterDataExport {
  'backEndPrincipal' : string,
  'currentCyclesBalance_backend' : bigint,
  'lastRecordedTime' : bigint,
  'acceptingRequests' : boolean,
  'journalCount' : bigint,
  'backEndCyclesBurnRatePerDay' : bigint,
  'nftOwner' : string,
  'managerCanisterPrincipal' : string,
  'lastRecordedBackEndCyclesBalance' : bigint,
  'nftId' : bigint,
  'currentCyclesBalance_frontend' : bigint,
  'frontEndPrincipal' : string,
  'profilesMetaData' : ProfilesApprovalStatuses,
  'supportMode' : boolean,
  'isOwner' : boolean,
}
export interface Dip721NonFungibleTokenInput {
  'maxLimit' : number,
  'logo' : LogoResult,
  'name' : string,
  'symbol' : string,
}
export interface EntryKey { 'entryKey' : bigint }
export type Error = { 'WalletBalanceTooLow' : null } |
  { 'ZeroAddress' : null } |
  { 'TxFailed' : null } |
  { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'AlreadyExists' : null } |
  { 'NotAcceptingRequests' : null } |
  { 'UserNameTaken' : null } |
  { 'NoInputGiven' : null } |
  { 'InsufficientFunds' : null };
export interface FileMetaData {
  'fileName' : string,
  'fileType' : string,
  'lastModified' : bigint,
}
export interface ICP { 'e8s' : bigint }
export interface JournalEntry {
  'unlockTime' : bigint,
  'emailThree' : string,
  'date' : string,
  'read' : boolean,
  'sent' : boolean,
  'text' : string,
  'filesMetaData' : Array<FileMetaData>,
  'emailOne' : string,
  'emailTwo' : string,
  'draft' : boolean,
  'location' : string,
  'entryTitle' : string,
}
export interface JournalEntryInput {
  'unlockTime' : bigint,
  'emailThree' : string,
  'date' : string,
  'text' : string,
  'filesMetaData' : Array<FileMetaData>,
  'emailOne' : string,
  'emailTwo' : string,
  'draft' : boolean,
  'location' : string,
  'entryTitle' : string,
}
export interface LogoResult { 'data' : string, 'logo_type' : string }
export type MetadataResult = { 'Ok' : Uint8Array } |
  { 'Err' : ApiError };
export type MintReceipt = { 'Ok' : MintReceiptPart } |
  { 'Err' : ApiError };
export interface MintReceiptPart { 'id' : bigint, 'token_id' : TokenId }
export interface ProfileInput {
  'userName' : [] | [string],
  'email' : [] | [string],
}
export type ProfilesApprovalStatuses = Array<[string, Approved]>;
export type RequestsForAccess = Array<[string, Approved]>;
export type Result = { 'ok' : null } |
  { 'err' : ApiError };
export type Result_1 = { 'ok' : string } |
  { 'err' : Error };
export type Result_10 = {
    'ok' : {
      'userName' : [] | [string],
      'principal' : string,
      'email' : [] | [string],
      'userJournalData' : [Array<[bigint, JournalEntry]>, Bio],
    }
  } |
  { 'err' : Error };
export type Result_11 = { 'ok' : bigint } |
  { 'err' : Error };
export type Result_12 = { 'ok' : Uint8Array } |
  { 'err' : Error };
export type Result_13 = { 'ok' : JournalEntry } |
  { 'err' : Error };
export type Result_14 = {
    'ok' : Array<[{ 'nftCollectionKey' : bigint }, TokenMetaData]>
  } |
  { 'err' : Error };
export type Result_15 = {
    'ok' : Array<[string, Array<[bigint, JournalEntry]>]>
  } |
  { 'err' : Error };
export type Result_16 = { 'ok' : CanisterDataExport } |
  { 'err' : Error };
export type Result_17 = { 'ok' : bigint } |
  { 'err' : Error };
export type Result_18 = { 'ok' : AmountAccepted } |
  { 'err' : Error };
export type Result_2 = { 'ok' : null } |
  { 'err' : Error };
export type Result_3 = { 'ok' : Bio } |
  { 'err' : Error };
export type Result_4 = { 'ok' : [Array<[bigint, JournalEntry]>, Bio] } |
  { 'err' : Error };
export type Result_5 = { 'ok' : ProfilesApprovalStatuses } |
  { 'err' : Error };
export type Result_6 = { 'ok' : CanisterData } |
  { 'err' : Error };
export type Result_7 = { 'ok' : RequestsForAccess } |
  { 'err' : Error };
export type Result_8 = { 'ok' : { 'balance' : ICP, 'address' : Uint8Array } } |
  { 'err' : Error };
export type Result_9 = { 'ok' : Array<[bigint, Transaction]> } |
  { 'err' : Error };
export type TokenId = bigint;
export interface TokenMetaData {
  'id' : TokenId,
  'nftDataTrieSize' : bigint,
  'fileType' : string,
  'numberOfCopiesOwned' : bigint,
}
export interface Transaction {
  'source' : [] | [AccountIdentifier],
  'timeStamp' : [] | [bigint],
  'recipient' : [] | [AccountIdentifier],
  'balanceDelta' : bigint,
  'increase' : boolean,
}
export type TxReceipt = { 'Ok' : bigint } |
  { 'Err' : ApiError };
export interface User {
  'canisterAccount' : ActorMethod<[], AccountIdentifier>,
  'canisterBalance' : ActorMethod<[], ICP>,
  'clearUnsubmittedFiles' : ActorMethod<[], Result_2>,
  'configureApp' : ActorMethod<[string, bigint], Result_2>,
  'create' : ActorMethod<[], Result_18>,
  'createNFTCollection' : ActorMethod<[Dip721NonFungibleTokenInput], Result_17>,
  'delete' : ActorMethod<[], Result_2>,
  'deleteSubmittedFile' : ActorMethod<[string], Result_2>,
  'deleteUnsubmittedFile' : ActorMethod<[string], Result_2>,
  'getCanisterCongtrollers' : ActorMethod<[Principal], Array<string>>,
  'getCanisterCyclesBalances' : ActorMethod<[], CanisterCyclesBalances>,
  'getCanisterData' : ActorMethod<[], Result_16>,
  'getEntriesToBeSent' : ActorMethod<[], Result_15>,
  'getNftChunk' : ActorMethod<[bigint, bigint, bigint], MetadataResult>,
  'getPrincipalsList' : ActorMethod<[], Array<Principal>>,
  'getRequestingPrincipals' : ActorMethod<[], Result_7>,
  'getUserNFTsInfo' : ActorMethod<[], Result_14>,
  'grantAccess' : ActorMethod<[string], Result_7>,
  'installCode' : ActorMethod<[Uint8Array], undefined>,
  'mainCanisterCyclesBalance' : ActorMethod<[], bigint>,
  'mintNft' : ActorMethod<[bigint, string, bigint], MintReceipt>,
  'readEntry' : ActorMethod<[EntryKey], Result_13>,
  'readEntryFileChunk' : ActorMethod<[string, bigint], Result_12>,
  'readEntryFileSize' : ActorMethod<[string], Result_11>,
  'readJournal' : ActorMethod<[], Result_10>,
  'readTransaction' : ActorMethod<[], Result_9>,
  'readWalletData' : ActorMethod<[], Result_8>,
  'registerOwner' : ActorMethod<[], Result_2>,
  'removeFromRequestsList' : ActorMethod<[string], Result_7>,
  'requestApproval' : ActorMethod<[], Result_7>,
  'safeTransferNFT' : ActorMethod<[bigint, Principal, TokenId], TxReceipt>,
  'submitFiles' : ActorMethod<[], Result_2>,
  'toggleAcceptRequest' : ActorMethod<[], Result_6>,
  'toggleSupportMode' : ActorMethod<[], Result_2>,
  'transferICP' : ActorMethod<[bigint, AccountIdentifier], Result_2>,
  'updateApprovalStatus' : ActorMethod<[string, boolean], Result_5>,
  'updateBio' : ActorMethod<[Bio], Result_3>,
  'updateJournalEntry' : ActorMethod<
    [[] | [EntryKey], [] | [JournalEntryInput]],
    Result_4
  >,
  'updatePhotos' : ActorMethod<[Array<FileMetaData>], Result_3>,
  'updateProfile' : ActorMethod<[ProfileInput], Result_2>,
  'uploadJournalEntryFile' : ActorMethod<
    [string, bigint, Uint8Array],
    Result_1
  >,
  'uploadNftChunk' : ActorMethod<[bigint, bigint, Uint8Array], Result>,
  'wallet_receive' : ActorMethod<[], { 'accepted' : bigint }>,
  'whoAmI' : ActorMethod<[], string>,
}
export interface _SERVICE extends User {}
