import Account "../Ledger/Account";

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

    public type JournalEntry = {
        entryTitle: Text;
        text: Text;
        location: Text;
        date: Text;
        lockTime: Int;
        unlockTime: Int;
        sent: Bool;
        emailOne: Text;
        emailTwo: Text;
        emailThree: Text;
        read: Bool;
        draft: Bool;
        file1MetaData: {
            fileName: Text;
            lastModified: Int;
            fileType: Text;
        };
        file2MetaData: {
            fileName: Text;
            lastModified: Int;
            fileType: Text;
        };
    }; 

    public type JournalEntryInput = {
        entryTitle: Text;
        text: Text;
        location: Text;
        date: Text;
        lockTime: Int;
        emailOne: Text;
        emailTwo: Text;
        emailThree: Text;
        draft: Bool;
        file1MetaData: {
            fileName: Text;
            lastModified: Int;
            fileType: Text;
        };
        file2MetaData: {
            fileName: Text;
            lastModified: Int;
            fileType: Text;
        };
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
    };
    
}