import Account "../../Serializers/Account";
import Trie "mo:base/Trie";
import HashMap "mo:base/HashMap";
import NotificationsTypes "../Notifications/types";
module {
    public type EntryKey = {
        entryKey: Nat;
    };

    public type Bio = {
        name : Text;
        dob: ?Int;
        pob: Text;
        dedications: Text;
        preface: Text;
        photos: [FileMetaData];
    };

    public type Balances = {
        icp: {e8s : Nat64};
        eth: {e8s: Nat64};
        btc: {e8s: Nat64};
        icp_staked: {e8s: Nat64};
    };

    public type Files = Trie.Trie2D<Text,Nat,Blob>;

    public type File = Trie.Trie<Nat,Blob>;

    public type FileMap = HashMap.HashMap<Text, File>;


    public type FileMetaData = {
        fileName: Text;
        lastModified: Int;
        fileType: Text;
    };

    public type JournalEntry = {
        title: Text;
        text: Text;
        location: Text;
        timeStarted: Int;
        timeSubmited: ?Int;
        timeOfUnlock: ?Int;
        notified: Bool;
        read: Bool;
        submitted: Bool;
        filesMetaData : [FileMetaData];
    }; 

    public type JournalEntryKeyValuePair = (Nat, JournalEntry);

    public type JournalEntryExport = {
        title: Text;
        text: Text;
        location: Text;
        timeStarted: Int;
        timeSubmited: ?Int;
        timeOfUnlock: ?Int;
        notified: Bool;
        read: Bool;
        submitted: Bool;
        locked: Bool;
        filesMetaData : [FileMetaData];
    };

    public type JournalEntryExportKeyValuePair = (Nat, JournalEntryExport);

    public let JournalEntryDefault = {
        title = "";
        text =  "";
        location = "";
        timeStarted =  0;
        timeSubmited = null;
        timeOfUnlock = null;
        submitted = false;
        filesMetaData = [];
        notified = false;
        read = false;
    };

    public type JournalMap = HashMap.HashMap<Nat, JournalEntry>;

    public type Transaction = {
        balanceDelta: Nat64;
        increase: Bool;
        recipient: Account.AccountIdentifier;
        timeStamp: Nat64;
        source: Account.AccountIdentifier;
    };

    public type TxHistoryMap = HashMap.HashMap<Nat, Transaction>;

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
        #NoRemainingStorage;
    };

    public type ReadJournalResult = {
        userJournalData : ([JournalEntryExportKeyValuePair], Bio); 
        email: ?Text; 
        userName: ?Text;
        principal: Text;
    };

    public let DEFAULT_BIO: Bio = {
        name = "";
        dob = null;
        pob = "";
        dedications = "";
        preface = "";
        photos = [];
    };

    public let DEFAULT_MAIN_CANISTER_ID: Text = "null";

    public let ZERO_NAT : Nat = 0;

    public let TX_FEE : Nat64 = 10_000;

    public let MAX_CYCLES_CAPACITY : Nat = 1_000_000_000_000;

    public let ONE_MEGA_BYTE : Nat = 1_000_000;

    public let ONE_GIGA_BYTE : Nat = 1_000_000_000;    
}