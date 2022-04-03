import Ledger "Ledger";
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
    };

    type Bio = {
        name : Text;
        dob: Text;
        pob: Text;
        dedications: Text;
        preface: Text;
    };


    //Application State
    //stable makes it so that the variable persists across updates to the canister
    //var refers to the data being a variable
    //profiles is the name of the variable
    //Trie.Trie is the data type. a Trie is a key/value map where Nat is the key and Profile is the data type
    // and it has been initialized as empty. hence the Trie.empty()

    private stable var journalV2 : Trie.Trie<Nat, JournalEntryV2> = Trie.empty();

    private stable var files : Trie.Trie2D<Text,Nat,Blob> = Trie.empty();

    private stable var biography : Bio = {
        name = "";
        dob = "";
        pob = "";
        dedications = "";
        preface = "";
    };

    private stable var journalEntryIndex : Nat = 0;

    private var capacity = 1000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private var balance = Cycles.balance();

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public shared(msg) func wallet_balance() : async Nat {
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

    public func createEntry( journalEntry : JournalEntryInput) : async Result.Result<Trie.Trie<Nat, JournalEntryV2>, Error> {

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
        
        let (newJournal, oldJournal) = Trie.put(
            journalV2,
            natKey(journalEntryIndex),
            Nat.equal,
            completeEntry
        );

        journalV2 := newJournal;

        journalEntryIndex += 1;

        #ok(journalV2);
            
        

    };

    public func createFile(fileId: Text ,chunkId : Nat, blobChunk : Blob) : async Result.Result<(), Error> {

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

    public func readJournal() : async ([(Nat,JournalEntryV2)], Bio) {
        let journalAsArray = Iter.toArray(Trie.iter(journalV2));
        return ((journalAsArray), biography);
    };

    public func getEntriesToBeSent() : async ([(Nat, JournalEntryV2)]) {
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

                    let (newJournal, oldJournal) = Trie.put(
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

    public func readJournalEntry(key : Nat): async Result.Result<JournalEntryV2, Error> {

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

                let (newJournal, oldJournal) = Trie.put(
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

    public func readJournalFileChunk (fileId : Text, chunkId: Nat) : async Result.Result<(Blob),Error> {

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

    public func readJournalFileSize (fileId : Text) : async Result.Result<(Nat),Error> {

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

    public func updateBio(bio: Bio) : async Result.Result<(), Error>{
        biography := bio;
        #ok(());
    };



    public func updateJournalEntry(key: Nat, journalEntry: JournalEntryInput) : async Result.Result<Trie.Trie<Nat,JournalEntryV2>,Error> {

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

                let (newJournal, oldEntryValue) = Trie.put(
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

    public func updateJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk : Blob) : async Result.Result<(),Error> {

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



    public func deleteJournalEntry(key: Nat) : async Result.Result<Trie.Trie<Nat,JournalEntryV2>,Error> {
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

    public func deleteJournalEntryFile(fileId: Text) : async Result.Result<(),Error> {
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

    public func transferICP(amount: Nat64, recipientAccountId: Account.AccountIdentifier) : async Bool {

        let res = await ledger.transfer({
          memo = Nat64.fromNat(10);
          from_subaccount = null;
          to = recipientAccountId;
          amount = { e8s = amount };
          fee = { e8s = 10_000 };
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

    private func userAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query func canisterAccount() : async Account.AccountIdentifier {
        userAccountId()
    };

    public func canisterBalance() : async Ledger.ICP {
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

    // system func postupgrade() {

    //    let journalIter = Trie.iter(journal);
    //    Iter.iterate<(Nat, JournalEntry)>(journalIter, func(x : (Nat, JournalEntry), _index) {

    //        let completeJournalEntry : JournalEntryV2 = {
    //             entryTitle = x.1.entryTitle;
    //             text = x.1.text;
    //             location = x.1.location;
    //             date = x.1.date;
    //             lockTime = x.1.lockTime;
    //             unlockTime = x.1.unlockTime;
    //             sent = false;
    //             read = false;
    //             emailOne = x.1.emailOne;
    //             emailTwo = x.1.emailTwo;
    //             emailThree = x.1.emailThree;
    //             file1MetaData = x.1.file1MetaData;
    //             file2MetaData = x.1.file2MetaData;
    //         };

    //         let (updatedJournal, previousValue) = Trie.put(
    //             journalV2,
    //             natKey(x.0),
    //             Nat.equal,
    //             completeJournalEntry  
    //         );
    //         journalV2 := updatedJournal;
    //     });
    // };

}