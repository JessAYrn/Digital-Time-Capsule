export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Trie = IDL.Rec();
  const AccountIdentifier = IDL.Vec(IDL.Nat8);
  const Tokens = IDL.Record({ 'e8s' : IDL.Nat64 });
  const AmountAccepted = IDL.Record({ 'accepted' : IDL.Nat64 });
  const Error = IDL.Variant({
    'TxFailed' : IDL.Null,
    'NotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'AlreadyExists' : IDL.Null,
    'UserNameTaken' : IDL.Null,
    'NoInputGiven' : IDL.Null,
    'InsufficientFunds' : IDL.Null,
  });
  const Result_7 = IDL.Variant({ 'ok' : AmountAccepted, 'err' : Error });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Error });
  const JournalEntry = IDL.Record({
    'unlockTime' : IDL.Int,
    'emailThree' : IDL.Text,
    'date' : IDL.Text,
    'sent' : IDL.Bool,
    'text' : IDL.Text,
    'lockTime' : IDL.Int,
    'emailOne' : IDL.Text,
    'emailTwo' : IDL.Text,
    'location' : IDL.Text,
    'entryTitle' : IDL.Text,
    'file1ID' : IDL.Text,
    'file2ID' : IDL.Text,
  });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Vec(
      IDL.Tuple(IDL.Text, IDL.Vec(IDL.Tuple(IDL.Nat, JournalEntry)))
    ),
    'err' : Error,
  });
  const EntryKey = IDL.Record({ 'entryKey' : IDL.Nat });
  const Result_5 = IDL.Variant({ 'ok' : JournalEntry, 'err' : Error });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : Error });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : Error });
  const Bio = IDL.Record({
    'dob' : IDL.Text,
    'pob' : IDL.Text,
    'preface' : IDL.Text,
    'name' : IDL.Text,
    'dedications' : IDL.Text,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Record({
      'userName' : IDL.Opt(IDL.Text),
      'balance' : Tokens,
      'email' : IDL.Opt(IDL.Text),
      'address' : IDL.Vec(IDL.Nat8),
      'userJournalData' : IDL.Tuple(
        IDL.Vec(IDL.Tuple(IDL.Nat, JournalEntry)),
        Bio,
      ),
    }),
    'err' : Error,
  });
  const JournalEntryInput = IDL.Record({
    'emailThree' : IDL.Text,
    'date' : IDL.Text,
    'text' : IDL.Text,
    'lockTime' : IDL.Int,
    'emailOne' : IDL.Text,
    'emailTwo' : IDL.Text,
    'location' : IDL.Text,
    'entryTitle' : IDL.Text,
    'file1ID' : IDL.Text,
    'file2ID' : IDL.Text,
  });
  const Branch = IDL.Record({
    'left' : Trie,
    'size' : IDL.Nat,
    'right' : Trie,
  });
  const Hash = IDL.Nat32;
  const Key = IDL.Record({ 'key' : IDL.Nat, 'hash' : Hash });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Tuple(Key, JournalEntry), List)));
  const AssocList = IDL.Opt(IDL.Tuple(IDL.Tuple(Key, JournalEntry), List));
  const Leaf = IDL.Record({ 'size' : IDL.Nat, 'keyvals' : AssocList });
  Trie.fill(
    IDL.Variant({ 'branch' : Branch, 'leaf' : Leaf, 'empty' : IDL.Null })
  );
  const Result_1 = IDL.Variant({ 'ok' : Trie, 'err' : Error });
  const ProfileInput = IDL.Record({
    'userName' : IDL.Opt(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
  });
  const User = IDL.Service({
    'canisterAccount' : IDL.Func([], [AccountIdentifier], ['query']),
    'canisterBalance' : IDL.Func([], [Tokens], []),
    'create' : IDL.Func([], [Result_7], []),
    'createJournalEntryFile' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
    'delete' : IDL.Func([], [Result], []),
    'getEntriesToBeSent' : IDL.Func([], [Result_6], []),
    'readEntry' : IDL.Func([EntryKey], [Result_5], []),
    'readEntryFileChunk' : IDL.Func([IDL.Text, IDL.Nat], [Result_4], []),
    'readEntryFileSize' : IDL.Func([IDL.Text], [Result_3], []),
    'readJournal' : IDL.Func([], [Result_2], []),
    'transferICP' : IDL.Func([IDL.Nat64, AccountIdentifier], [Result], []),
    'updateBio' : IDL.Func([Bio], [Result], []),
    'updateJournalEntry' : IDL.Func(
        [IDL.Opt(EntryKey), IDL.Opt(JournalEntryInput)],
        [Result_1],
        [],
      ),
    'updateProfile' : IDL.Func([ProfileInput], [Result], []),
  });
  return User;
};
export const init = ({ IDL }) => { return []; };
