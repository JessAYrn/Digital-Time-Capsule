import Account "../Ledger/Account";
import Trie "mo:base/Trie";

module {
    public type EntryKey = {
        entryKey: Nat;
    };

    public type Bio = {
        name : Text;
        dob: Text;
        pob: Text;
        dedications: Text;
        preface: Text;
    };

    public type Files = Trie.Trie2D<Text,Nat,Blob>;

    public type File = Trie.Trie<Nat,Blob>;


    public type FileMetaData = {
        fileName: Text;
        lastModified: Int;
        fileType: Text;
    };

    public type JournalEntry = {
        entryTitle: Text;
        text: Text;
        location: Text;
        date: Text;
        unlockTime: Int;
        sent: Bool;
        emailOne: Text;
        emailTwo: Text;
        emailThree: Text;
        read: Bool;
        draft: Bool;
        filesMetaData : [FileMetaData];
    }; 

    public type JournalEntryInput = {
        entryTitle: Text;
        text: Text;
        location: Text;
        date: Text;
        unlockTime: Int;
        emailOne: Text;
        emailTwo: Text;
        emailThree: Text;
        draft: Bool;
        filesMetaData : [FileMetaData];
    };

    public type Transaction = {
        balanceDelta: Nat64;
        increase: Bool;
        recipient: ?Account.AccountIdentifier;
        timeStamp: ?Nat64;
        source: ?Account.AccountIdentifier;
    };

    public type Error ={
        #NotFound;
        #AlreadyExists;
        #NotAuthorized;
        #NoInputGiven;
        #InsufficientFunds;
        #TxFailed;
        #UserNameTaken;
        #WalletBalanceTooLow;
        #ZeroAddress;
        #NotAcceptingRequests;
    };
    
}