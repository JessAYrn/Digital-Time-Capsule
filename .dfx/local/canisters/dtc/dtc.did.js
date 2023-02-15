export const idlFactory = ({ IDL }) => {
  const AccountIdentifier = IDL.Vec(IDL.Nat8);
  const ICP = IDL.Record({ 'e8s' : IDL.Nat64 });
  const Error = IDL.Variant({
    'WalletBalanceTooLow' : IDL.Null,
    'ZeroAddress' : IDL.Null,
    'TxFailed' : IDL.Null,
    'NotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'AlreadyExists' : IDL.Null,
    'NotAcceptingRequests' : IDL.Null,
    'UserNameTaken' : IDL.Null,
    'NoInputGiven' : IDL.Null,
    'InsufficientFunds' : IDL.Null,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Null, 'err' : Error });
  const AmountAccepted = IDL.Record({ 'accepted' : IDL.Nat64 });
  const Result_18 = IDL.Variant({ 'ok' : AmountAccepted, 'err' : Error });
  const LogoResult = IDL.Record({ 'data' : IDL.Text, 'logo_type' : IDL.Text });
  const Dip721NonFungibleTokenInput = IDL.Record({
    'maxLimit' : IDL.Nat16,
    'logo' : LogoResult,
    'name' : IDL.Text,
    'symbol' : IDL.Text,
  });
  const Result_17 = IDL.Variant({ 'ok' : IDL.Nat64, 'err' : Error });
  const CanisterCyclesBalances = IDL.Record({
    'frontendCyclesBalance' : IDL.Nat,
    'backendCyclesBalance' : IDL.Nat,
  });
  const Approved = IDL.Bool;
  const ProfilesApprovalStatuses = IDL.Vec(IDL.Tuple(IDL.Text, Approved));
  const CanisterDataExport = IDL.Record({
    'backEndPrincipal' : IDL.Text,
    'currentCyclesBalance_backend' : IDL.Nat,
    'lastRecordedTime' : IDL.Int,
    'acceptingRequests' : IDL.Bool,
    'journalCount' : IDL.Nat,
    'backEndCyclesBurnRatePerDay' : IDL.Nat,
    'nftOwner' : IDL.Text,
    'managerCanisterPrincipal' : IDL.Text,
    'lastRecordedBackEndCyclesBalance' : IDL.Nat,
    'nftId' : IDL.Int,
    'currentCyclesBalance_frontend' : IDL.Nat,
    'frontEndPrincipal' : IDL.Text,
    'profilesMetaData' : ProfilesApprovalStatuses,
    'supportMode' : IDL.Bool,
    'isOwner' : IDL.Bool,
  });
  const Result_16 = IDL.Variant({ 'ok' : CanisterDataExport, 'err' : Error });
  const FileMetaData = IDL.Record({
    'fileName' : IDL.Text,
    'fileType' : IDL.Text,
    'lastModified' : IDL.Int,
  });
  const JournalEntry = IDL.Record({
    'unlockTime' : IDL.Int,
    'emailThree' : IDL.Text,
    'date' : IDL.Text,
    'read' : IDL.Bool,
    'sent' : IDL.Bool,
    'text' : IDL.Text,
    'filesMetaData' : IDL.Vec(FileMetaData),
    'emailOne' : IDL.Text,
    'emailTwo' : IDL.Text,
    'draft' : IDL.Bool,
    'location' : IDL.Text,
    'entryTitle' : IDL.Text,
  });
  const Result_15 = IDL.Variant({
    'ok' : IDL.Vec(
      IDL.Tuple(IDL.Text, IDL.Vec(IDL.Tuple(IDL.Nat, JournalEntry)))
    ),
    'err' : Error,
  });
  const ApiError = IDL.Variant({
    'ZeroAddress' : IDL.Null,
    'InvalidTokenId' : IDL.Null,
    'Unauthorized' : IDL.Null,
    'Other' : IDL.Null,
  });
  const MetadataResult = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Nat8),
    'Err' : ApiError,
  });
  const RequestsForAccess = IDL.Vec(IDL.Tuple(IDL.Text, Approved));
  const Result_7 = IDL.Variant({ 'ok' : RequestsForAccess, 'err' : Error });
  const TokenId = IDL.Nat64;
  const TokenMetaData = IDL.Record({
    'id' : TokenId,
    'nftDataTrieSize' : IDL.Nat,
    'fileType' : IDL.Text,
    'numberOfCopiesOwned' : IDL.Nat,
  });
  const Result_14 = IDL.Variant({
    'ok' : IDL.Vec(
      IDL.Tuple(IDL.Record({ 'nftCollectionKey' : IDL.Nat }), TokenMetaData)
    ),
    'err' : Error,
  });
  const MintReceiptPart = IDL.Record({ 'id' : IDL.Nat, 'token_id' : TokenId });
  const MintReceipt = IDL.Variant({ 'Ok' : MintReceiptPart, 'Err' : ApiError });
  const EntryKey = IDL.Record({ 'entryKey' : IDL.Nat });
  const Result_13 = IDL.Variant({ 'ok' : JournalEntry, 'err' : Error });
  const Result_12 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : Error });
  const Result_11 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : Error });
  const Bio = IDL.Record({
    'dob' : IDL.Text,
    'pob' : IDL.Text,
    'preface' : IDL.Text,
    'name' : IDL.Text,
    'photos' : IDL.Vec(FileMetaData),
    'dedications' : IDL.Text,
  });
  const Result_10 = IDL.Variant({
    'ok' : IDL.Record({
      'userName' : IDL.Opt(IDL.Text),
      'principal' : IDL.Text,
      'email' : IDL.Opt(IDL.Text),
      'userJournalData' : IDL.Tuple(
        IDL.Vec(IDL.Tuple(IDL.Nat, JournalEntry)),
        Bio,
      ),
    }),
    'err' : Error,
  });
  const Transaction = IDL.Record({
    'source' : IDL.Opt(AccountIdentifier),
    'timeStamp' : IDL.Opt(IDL.Nat64),
    'recipient' : IDL.Opt(AccountIdentifier),
    'balanceDelta' : IDL.Nat64,
    'increase' : IDL.Bool,
  });
  const Result_9 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Nat, Transaction)),
    'err' : Error,
  });
  const Result_8 = IDL.Variant({
    'ok' : IDL.Record({ 'balance' : ICP, 'address' : IDL.Vec(IDL.Nat8) }),
    'err' : Error,
  });
  const TxReceipt = IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : ApiError });
  const CanisterData = IDL.Record({
    'backEndPrincipal' : IDL.Text,
    'lastRecordedTime' : IDL.Int,
    'acceptingRequests' : IDL.Bool,
    'backEndCyclesBurnRatePerDay' : IDL.Nat,
    'nftOwner' : IDL.Text,
    'managerCanisterPrincipal' : IDL.Text,
    'lastRecordedBackEndCyclesBalance' : IDL.Nat,
    'nftId' : IDL.Int,
    'frontEndPrincipal' : IDL.Text,
  });
  const Result_6 = IDL.Variant({ 'ok' : CanisterData, 'err' : Error });
  const Result_5 = IDL.Variant({
    'ok' : ProfilesApprovalStatuses,
    'err' : Error,
  });
  const Result_3 = IDL.Variant({ 'ok' : Bio, 'err' : Error });
  const JournalEntryInput = IDL.Record({
    'unlockTime' : IDL.Int,
    'emailThree' : IDL.Text,
    'date' : IDL.Text,
    'text' : IDL.Text,
    'filesMetaData' : IDL.Vec(FileMetaData),
    'emailOne' : IDL.Text,
    'emailTwo' : IDL.Text,
    'draft' : IDL.Bool,
    'location' : IDL.Text,
    'entryTitle' : IDL.Text,
  });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Vec(IDL.Tuple(IDL.Nat, JournalEntry)), Bio),
    'err' : Error,
  });
  const ProfileInput = IDL.Record({
    'userName' : IDL.Opt(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : Error });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : ApiError });
  const User = IDL.Service({
    'canisterAccount' : IDL.Func([], [AccountIdentifier], ['query']),
    'canisterBalance' : IDL.Func([], [ICP], []),
    'clearUnsubmittedFiles' : IDL.Func([], [Result_2], []),
    'configureApp' : IDL.Func([IDL.Text, IDL.Int], [Result_2], []),
    'create' : IDL.Func([], [Result_18], []),
    'createNFTCollection' : IDL.Func(
        [Dip721NonFungibleTokenInput],
        [Result_17],
        [],
      ),
    'delete' : IDL.Func([], [Result_2], []),
    'deleteSubmittedFile' : IDL.Func([IDL.Text], [Result_2], []),
    'deleteUnsubmittedFile' : IDL.Func([IDL.Text], [Result_2], []),
    'getCanisterCongtrollers' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(IDL.Text)],
        [],
      ),
    'getCanisterCyclesBalances' : IDL.Func([], [CanisterCyclesBalances], []),
    'getCanisterData' : IDL.Func([], [Result_16], []),
    'getEntriesToBeSent' : IDL.Func([], [Result_15], []),
    'getNftChunk' : IDL.Func(
        [IDL.Nat, IDL.Nat64, IDL.Nat],
        [MetadataResult],
        [],
      ),
    'getPrincipalsList' : IDL.Func([], [IDL.Vec(IDL.Principal)], []),
    'getRequestingPrincipals' : IDL.Func([], [Result_7], []),
    'getUserNFTsInfo' : IDL.Func([], [Result_14], []),
    'grantAccess' : IDL.Func([IDL.Text], [Result_7], []),
    'installCode' : IDL.Func([IDL.Vec(IDL.Nat8)], [], []),
    'mainCanisterCyclesBalance' : IDL.Func([], [IDL.Nat], []),
    'mintNft' : IDL.Func([IDL.Nat, IDL.Text, IDL.Nat], [MintReceipt], []),
    'readEntry' : IDL.Func([EntryKey], [Result_13], []),
    'readEntryFileChunk' : IDL.Func([IDL.Text, IDL.Nat], [Result_12], []),
    'readEntryFileSize' : IDL.Func([IDL.Text], [Result_11], []),
    'readJournal' : IDL.Func([], [Result_10], []),
    'readTransaction' : IDL.Func([], [Result_9], []),
    'readWalletData' : IDL.Func([], [Result_8], []),
    'registerOwner' : IDL.Func([], [Result_2], []),
    'removeFromRequestsList' : IDL.Func([IDL.Text], [Result_7], []),
    'requestApproval' : IDL.Func([], [Result_7], []),
    'safeTransferNFT' : IDL.Func(
        [IDL.Nat, IDL.Principal, TokenId],
        [TxReceipt],
        [],
      ),
    'submitFiles' : IDL.Func([], [Result_2], []),
    'toggleAcceptRequest' : IDL.Func([], [Result_6], []),
    'toggleSupportMode' : IDL.Func([], [Result_2], []),
    'transferICP' : IDL.Func([IDL.Nat64, AccountIdentifier], [Result_2], []),
    'updateApprovalStatus' : IDL.Func([IDL.Text, IDL.Bool], [Result_5], []),
    'updateBio' : IDL.Func([Bio], [Result_3], []),
    'updateJournalEntry' : IDL.Func(
        [IDL.Opt(EntryKey), IDL.Opt(JournalEntryInput)],
        [Result_4],
        [],
      ),
    'updatePhotos' : IDL.Func([IDL.Vec(FileMetaData)], [Result_3], []),
    'updateProfile' : IDL.Func([ProfileInput], [Result_2], []),
    'uploadJournalEntryFile' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result_1],
        [],
      ),
    'uploadNftChunk' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
    'wallet_receive' : IDL.Func(
        [],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
    'whoAmI' : IDL.Func([], [IDL.Text], []),
  });
  return User;
};
export const init = ({ IDL }) => { return []; };
