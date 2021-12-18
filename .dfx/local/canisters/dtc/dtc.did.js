export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Trie = IDL.Rec();
  const ProfileInput = IDL.Record({ 'userName' : IDL.Text });
  const AmountAccepted = IDL.Record({ 'accepted' : IDL.Nat64 });
  const Error = IDL.Variant({
    'NotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'AlreadyExists' : IDL.Null,
    'NoInputGiven' : IDL.Null,
  });
  const Result_4 = IDL.Variant({ 'ok' : AmountAccepted, 'err' : Error });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Error });
  const EntryKey = IDL.Record({ 'entryKey' : IDL.Nat });
  const JournalEntry = IDL.Record({
    'date' : IDL.Text,
    'text' : IDL.Text,
    'lockTime' : IDL.Text,
    'location' : IDL.Text,
    'entryTitle' : IDL.Text,
  });
  const Result_3 = IDL.Variant({ 'ok' : JournalEntry, 'err' : Error });
  const Bio = IDL.Record({
    'dob' : IDL.Text,
    'name' : IDL.Text,
    'biography' : IDL.Text,
    'birthPlace' : IDL.Text,
    'siblings' : IDL.Text,
    'children' : IDL.Text,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Vec(IDL.Tuple(IDL.Nat, JournalEntry)), Bio),
    'err' : Error,
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
  const User = IDL.Service({
    'create' : IDL.Func([ProfileInput], [Result_4], []),
    'createJournalEntryFile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
    'delete' : IDL.Func([], [Result], []),
    'readEntry' : IDL.Func([EntryKey], [Result_3], []),
    'readJournal' : IDL.Func([], [Result_2], []),
    'updateJournalEntry' : IDL.Func(
        [IDL.Opt(EntryKey), IDL.Opt(JournalEntry)],
        [Result_1],
        [],
      ),
    'updateProfile' : IDL.Func([ProfileInput], [Result], []),
  });
  return User;
};
export const init = ({ IDL }) => { return []; };
