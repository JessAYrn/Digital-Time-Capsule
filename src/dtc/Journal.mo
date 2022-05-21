import Ledger "Ledger";
import LedgerCandid "LedgerCandid";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Trie "mo:base/Trie";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Account "./Account";
import Bool "mo:base/Bool";
import Option "mo:base/Option";

shared(msg) actor class Journal (principal : Principal) = this {
    let callerId = msg.caller;

    type JournalEntryV2 = {
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

    type JournalEntryInput = {
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

    type JournalFile = {
        file: Trie.Trie<Text, Blob>;
    };

    type Error ={
        #NotFound;
        #AlreadyExists;
        #NotAuthorized;
    };

    type Bio = {
        name : Text;
        dob: Text;
        pob: Text;
        dedications: Text;
        preface: Text;
    };

    type Transaction = {
        balanceDelta: Nat64;
        increase: Bool;
        recipient: ?Account.AccountIdentifier;
        timeStamp: ?Nat64;
        source: ?Account.AccountIdentifier;
    };


    //Application State
    //stable makes it so that the variable persists across updates to the canister
    //var refers to the data being a variable
    //profiles is the name of the variable
    //Trie.Trie is the data type. a Trie is a key/value map where Nat is the key and Profile is the data type
    // and it has been initialized as empty. hence the Trie.empty()

    private stable var journalV2 : Trie.Trie<Nat, JournalEntryV2> = Trie.empty();

    private stable var files : Trie.Trie2D<Text,Nat,Blob> = Trie.empty();

    private stable var txHistory : Trie.Trie<Nat, Transaction> = Trie.empty();

    private stable var biography : Bio = {
        name = "";
        dob = "";
        pob = "";
        dedications = "";
        preface = "";
    };

    private var mainCanisterId : Text = "hxx6x-baaaa-aaaap-qaaxq-cai";

    private var test1CanisterId : Text = "cxi6d-5iaaa-aaaap-qaaka-cai";

    private var test2CanisterId : Text = "rvsi5-uiaaa-aaaap-qadma-cai";

    private stable var journalEntryIndex : Nat = 0;

    private stable var txTrieIndex : Nat = 0;

    private var txFee : Nat64 = 10_000;

    private var capacity = 1000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private var balance = Cycles.balance();

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public shared(msg) func wallet_balance() : async Nat {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     throw Error.reject("Unauthorized access.");
        // };
        return balance
    };

    // Return the cycles received up to the capacity allowed
    public func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = capacity - balance;
        let accepted = 
            if (amount <= limit) amount
            else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        balance += accepted;
        { accepted = Nat64.fromNat(accepted) };
    };

    public shared(msg) func createEntry( journalEntry : JournalEntryInput) : async Result.Result<Trie.Trie<Nat, JournalEntryV2>, Error> {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     return #err(#NotAuthorized);
        // };

        let completeEntry  = {
            entryTitle = journalEntry.entryTitle;
            text = journalEntry.text;
            location = journalEntry.location;
            date = journalEntry.date;
            lockTime = journalEntry.lockTime;
            unlockTime = Time.now() + nanosecondsInADay * daysInAMonth * journalEntry.lockTime;
            sent = false;
            read = false;
            draft = journalEntry.draft;
            emailOne = journalEntry.emailOne;
            emailTwo = journalEntry.emailTwo;
            emailThree = journalEntry.emailThree;
            file1MetaData = journalEntry.file1MetaData;
            file2MetaData = journalEntry.file2MetaData;
        };
        
        let (newJournal, oldValueForThisKey) = Trie.put(
            journalV2,
            natKey(journalEntryIndex),
            Nat.equal,
            completeEntry
        );

        journalV2 := newJournal;

        journalEntryIndex += 1;

        #ok(journalV2);
    };

    public shared(msg) func createFile(fileId: Text ,chunkId : Nat, blobChunk : Blob) : async Result.Result<(), Error> {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     return #err(#NotAuthorized);
        // };

        let existingFile = Trie.find(
            files,
            textKey(fileId),
            Text.equal
        );

        switch(existingFile){
            case null{
                let updatedFiles = Trie.put2D(
                    files,
                    textKey(fileId),
                    Text.equal,
                    natKey(chunkId),
                    Nat.equal,
                    blobChunk
                );
                files := updatedFiles;
                #ok(());
            };
            case (? fileExists){
                let existingFileChunk = Trie.find(
                    fileExists,
                    natKey(chunkId),
                    Nat.equal
                );

                switch(existingFileChunk){
                    case null{
                        let updatedFiles = Trie.put2D(
                            files,
                            textKey(fileId),
                            Text.equal,
                            natKey(chunkId),
                            Nat.equal,
                            blobChunk
                        );
                        files := updatedFiles;
                        #ok(());
                    };
                    case (? fileChunk){
                        #err(#AlreadyExists);
                    };
                };
            };
        };
    };

    public shared(msg) func readJournal() : async ([(Nat,JournalEntryV2)], Bio) {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     throw Error.reject("Unauthorized access.");
        // };
        let journalAsArray = Iter.toArray(Trie.iter(journalV2));
        return ((journalAsArray), biography);
    };

    public shared(msg) func getEntriesToBeSent() : async ([(Nat, JournalEntryV2)]) {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     throw Error.reject("Unauthorized access.");
        // };

        let journalIter = Trie.iter(journalV2);
        let entriesToBeSentBuffer = Buffer.Buffer<(Nat, JournalEntryV2)>(1);

        Iter.iterate<(Nat, JournalEntryV2)>(journalIter, func(x : (Nat, JournalEntryV2), _index) {
            if(x.1.sent == false){
                if(Time.now() >= x.1.unlockTime){
                    entriesToBeSentBuffer.add(x);
                    let updatedJournalEntry = {
                        entryTitle = x.1.entryTitle;
                        text = x.1.text;
                        location = x.1.location;
                        date = x.1.date;
                        lockTime = x.1.lockTime;
                        unlockTime = x.1.unlockTime;
                        sent = true;
                        read = x.1.read;
                        draft = x.1.draft;
                        emailOne = x.1.emailOne;
                        emailTwo = x.1.emailTwo;
                        emailThree = x.1.emailThree;
                        file1MetaData = x.1.file1MetaData;
                        file2MetaData = x.1.file2MetaData;
                    };

                    let (newJournal, oldValueForThisKey) = Trie.put(
                        journalV2,
                        natKey(x.0),
                        Nat.equal,
                        updatedJournalEntry
                    );

                    journalV2 := newJournal;
                };
            };
        });

        let entriestoBeSentArray = entriesToBeSentBuffer.toArray();
        return entriestoBeSentArray;
    };

    public shared(msg) func readJournalEntry(key : Nat): async Result.Result<JournalEntryV2, Error> {

        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     return #err(#NotAuthorized);
        // };

        let entry = Trie.find(
            journalV2,
            natKey(key),
            Nat.equal
        );


        switch(entry){
            case null{
                #err(#NotFound);
            };
            case(? entryValue){
                
                let updatedEntryValue : JournalEntryV2 = {
                    entryTitle = entryValue.entryTitle;
                    text = entryValue.text;
                    location = entryValue.location;
                    date = entryValue.date;
                    lockTime = entryValue.lockTime;
                    unlockTime = entryValue.unlockTime;
                    sent = true;
                    read = true;
                    draft = entryValue.draft;
                    emailOne = entryValue.emailOne;
                    emailTwo = entryValue.emailTwo;
                    emailThree = entryValue.emailThree;
                    file1MetaData = entryValue.file1MetaData;
                    file2MetaData = entryValue.file2MetaData;
                };

                let (newJournal, oldValueForThisKey) = Trie.put(
                    journalV2,
                    natKey(key),
                    Nat.equal,
                    updatedEntryValue
                );

                journalV2 := newJournal;

                #ok(updatedEntryValue);
            };
        }
    };

    public shared(msg) func readJournalFileChunk (fileId : Text, chunkId: Nat) : async Result.Result<(Blob),Error> {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //    return #err(#NotAuthorized);
        // };

        let file = Trie.find(
            files,
            textKey(fileId),
            Text.equal,
        );

        switch(file){
            case null{
                #err(#NotFound);
            };
            case (? existingFile){
                let existingFileChunk = Trie.find(
                    existingFile,
                    natKey(chunkId),
                    Nat.equal
                );
                switch(existingFileChunk){
                    case null{
                        #err(#NotFound);
                    };
                    case (? existingChunk){
                        #ok(existingChunk);
                    }
                };
            };
        };
    };

    public shared(msg) func readJournalFileSize (fileId : Text) : async Result.Result<(Nat),Error> {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //    return #err(#NotAuthorized);
        // };

        let file = Trie.find(
            files,
            textKey(fileId),
            Text.equal,
        );

        switch(file){
            case null{
                #err(#NotFound);
            };
            case (? existingFile){
                let existingFileArraySize = Iter.size(Trie.iter(existingFile));
                #ok(existingFileArraySize);
            };
        };
    };

    public shared(msg) func updateBio(bio: Bio) : async Result.Result<(), Error>{
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //    return #err(#NotAuthorized);
        // };
        biography := bio;
        #ok(());
    };



    public shared(msg) func updateJournalEntry(key: Nat, journalEntry: JournalEntryInput) : async Result.Result<Trie.Trie<Nat,JournalEntryV2>,Error> {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //    return #err(#NotAuthorized);
        // };
        let entry = Trie.find(
            journalV2,
            natKey(key),
            Nat.equal
        );

        switch(entry){
            case null{
                #err(#NotFound);
            };
            case (? v){

                let completeEntry  = {
                    entryTitle = journalEntry.entryTitle;
                    text = journalEntry.text;
                    location = journalEntry.location;
                    date = journalEntry.date;
                    lockTime = journalEntry.lockTime;
                    unlockTime = Time.now() + nanosecondsInADay * daysInAMonth * journalEntry.lockTime;
                    sent = false;
                    read = false;
                    draft = journalEntry.draft;
                    emailOne = journalEntry.emailOne;
                    emailTwo = journalEntry.emailTwo;
                    emailThree = journalEntry.emailThree;
                    file1MetaData = journalEntry.file1MetaData;
                    file2MetaData = journalEntry.file2MetaData;
                };

                let (newJournal, oldValueForThisKey) = Trie.put(
                    journalV2,
                    natKey(key),
                    Nat.equal,
                    completeEntry
                );

                journalV2:= newJournal;

                #ok(newJournal);

            }
        }

    };

    public shared(msg) func updateJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk : Blob) : async Result.Result<(),Error> {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //    return #err(#NotAuthorized);
        // };
        let file = Trie.find(
            files,
            textKey(fileId),
            Text.equal
        );

        switch(file){
            case null{
                #err(#NotFound);
            };
            case (? existingFile){
                let updatedFiles = Trie.put2D(
                    files,
                    textKey(fileId),
                    Text.equal,
                    natKey(chunkId),
                    Nat.equal,
                    blobChunk
                );

                files := updatedFiles;
                #ok(());

            }
        }

    };



    public shared(msg) func deleteJournalEntry(key: Nat) : async Result.Result<Trie.Trie<Nat,JournalEntryV2>,Error> {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //    return #err(#NotAuthorized);
        // };
        let entry = Trie.find(
            journalV2,
            natKey(key),
            Nat.equal,
        );

        switch(entry){
            case null{
                #err(#NotFound);
            };
            case (? v){
                let updatedJournal = Trie.replace(
                    journalV2,
                    natKey(key),
                    Nat.equal,
                    null
                );

                journalV2 := updatedJournal.0;
                #ok(updatedJournal.0);

            };
        };

    };

    public shared(msg) func deleteJournalEntryFile(fileId: Text) : async Result.Result<(),Error> {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //    return #err(#NotAuthorized);
        // };
        let entryFiles = Trie.find(
            files,
            textKey(fileId),
            Text.equal,
        );

        switch(entryFiles){
            case null{
                #err(#NotFound);
            };
            case (? v){
                let (updatedFiles, existingFiles) = Trie.replace(
                    files,
                    textKey(fileId),
                    Text.equal,
                    null
                );

                files := updatedFiles;
                #ok(());

            };
        };

    };

    public shared(msg) func transferICP(amount: Nat64, recipientAccountId: Account.AccountIdentifier) : async Bool {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     throw Error.reject("Unauthorized access.");
        // };

        let res = await ledger.transfer({
          memo = Nat64.fromNat(10);
          from_subaccount = null;
          to = recipientAccountId;
          amount = { e8s = amount };
          fee = { e8s = txFee };
          created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
        });

        switch (res) {
          case (#Ok(blockIndex)) {

            Debug.print("Paid reward to " # debug_show principal # " in block " # debug_show blockIndex);
            return true;
          };
          case (#Err(#InsufficientFunds { balance })) {
            throw Error.reject("Top me up! The balance is only " # debug_show balance # " e8s");
            return false;
          };
          case (#Err(other)) {
            throw Error.reject("Unexpected error: " # debug_show other);
            return false;
          };
        };
    };

    public shared(msg) func readWalletTxHistory() : async [(Nat,Transaction)] {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     throw Error.reject("Unauthorized access.");
        // };
        
        Iter.toArray(Trie.iter(txHistory));
    };

    public shared(msg) func updateTxHistory(tx : Transaction) : async () {
        let callerId = msg.caller;
        if(
            Principal.toText(callerId) != mainCanisterId and 
            Principal.toText(callerId) != test1CanisterId and 
            Principal.toText(callerId) != test2CanisterId
        ) {
            throw Error.reject("Unauthorized access.");
        };

        let trieSize : Nat = Iter.size(Trie.iter(txHistory));
        let lastIndex : Nat = trieSize - 1;
        let result = Trie.nth(txHistory, lastIndex);

        switch(result){
            case null{

            };
            case(? existingTx){
                let timeOfTx = existingTx.1.timeStamp;
                switch(timeOfTx){
                    case null{
                        let (newTxHistoryTrie, oldValueForThisKey) = Trie.put(
                            txHistory,
                            natKey(txTrieIndex),
                            Nat.equal,
                            tx
                        );

                        txHistory := newTxHistoryTrie;
                        txTrieIndex += 1; 
                    };
                    case(? existingTimeOfTx){
                        switch(tx.timeStamp){
                            case null{

                            };
                            case(? existingTimeStampOnArgument){
                                if(Nat64.notEqual(existingTimeOfTx, existingTimeStampOnArgument) == true){
                                    let (newTxHistoryTrie, oldValueForThisKey) = Trie.put(
                                        txHistory,
                                        natKey(txTrieIndex),
                                        Nat.equal,
                                        tx
                                    );

                                    txHistory := newTxHistoryTrie;
                                    txTrieIndex += 1; 
                                };
                            };
                        };
                    };
                };
            };
        };
    };

    private func userAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query(msg) func canisterAccount() : async Account.AccountIdentifier {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     throw Error.reject("Unauthorized access.");
        // };
        userAccountId()
    };

    public shared(msg) func canisterBalance() : async Ledger.ICP {
        let callerId = msg.caller;
        // if(
        //     Principal.toText(callerId) != mainCanisterId and 
        //     Principal.toText(callerId) != test1CanisterId and 
        //     Principal.toText(callerId) != test2CanisterId
        // ) {
        //     throw Error.reject("Unauthorized access.");
        // };
        await ledger.account_balance({ account = userAccountId() })
    };
   
    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)}
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };

    private func textKey(x: Text) : Trie.Key<Text> {
        return {key = x; hash = Text.hash(x)}
    };

}