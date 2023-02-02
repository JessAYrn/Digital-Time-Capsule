import Ledger "../Ledger/Ledger";
import LedgerCandid "../Ledger/LedgerCandid";
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
import Account "../Ledger/Account";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import JournalTypes "journal.types";

shared(msg) actor class Journal (principal : Principal) = this {
    let callerId = msg.caller;

    private stable var journalV2 : Trie.Trie<Nat, JournalTypes.JournalEntry> = Trie.empty();

    private stable var files : JournalTypes.Files = Trie.empty();

    private stable var txHistory : Trie.Trie<Nat, JournalTypes.Transaction> = Trie.empty();

    private stable var unsubmittedFiles : JournalTypes.Files = Trie.empty();
    
    private stable var biography : JournalTypes.Bio = {
        name = "";
        dob = "";
        pob = "";
        dedications = "";
        preface = "";
        photos = [];
    };

    private stable var mainCanisterId_ : Text = "null"; 

    private stable var journalEntryIndex : Nat = 0;

    private stable var txTrieIndex : Nat = 0;

    private var txFee : Nat64 = 10_000;

    private var capacity = 1000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private var balance = Cycles.balance();

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private let oneICP : Nat64 = 100_000_000;

    public shared(msg) func wallet_balance() : async Nat {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_ ) {
            throw Error.reject("Unauthorized access.");
        };
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

    public shared(msg) func setMainCanisterPrincipalId() : async Result.Result<(),JournalTypes.Error> {
        let callerId = msg.caller;
        if(mainCanisterId_ != "null") return #err(#NotAuthorized);
        mainCanisterId_ := Principal.toText(callerId);
        return #ok(());
    };

    public shared(msg) func createEntry( journalEntry : JournalTypes.JournalEntryInput) : 
    async Result.Result<([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio), JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_ ) {
            return #err(#NotAuthorized);
        };

        let completeEntry  = {
            entryTitle = journalEntry.entryTitle;
            text = journalEntry.text;
            location = journalEntry.location;
            date = journalEntry.date;
            unlockTime = journalEntry.unlockTime;
            sent = false;
            read = false;
            draft = journalEntry.draft;
            emailOne = journalEntry.emailOne;
            emailTwo = journalEntry.emailTwo;
            emailThree = journalEntry.emailThree;
            filesMetaData  = journalEntry.filesMetaData;
        };
        
        let (newJournal, oldValueForThisKey) = Trie.put(
            journalV2,
            natKey(journalEntryIndex),
            Nat.equal,
            completeEntry
        );

        journalV2 := newJournal;

        journalEntryIndex += 1;
        let journalAsArray = Iter.toArray(Trie.iter(journalV2));
        #ok(((journalAsArray), biography));
    };

    public shared(msg) func clearUnsubmittedFiles(): async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_ ) {
            return #err(#NotAuthorized);
        };
        unsubmittedFiles := Trie.empty();
        return #ok(());
    };

    public shared(msg) func deleteSubmittedFile(fileId: Text): async Result.Result<(), JournalTypes.Error>{
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_ ) {
            return #err(#NotAuthorized);
        };
        let trieIter = Trie.iter(files);
        let trieSize = Trie.size(files);
        var trieArray = Iter.toArray(trieIter);
        var newTrie : JournalTypes.Files = Trie.empty();
        var index = 0;
        while(index < trieSize){
            let fileWithName = trieArray[index];
            let fileName = fileWithName.0;
            let file = fileWithName.1;
            if(fileName != fileId){
                let (updatedNewTrie, oldValueForThisKey) = Trie.put(
                    newTrie,
                    textKey(fileName),
                    Text.equal,
                    file
                );
                newTrie := updatedNewTrie;
            };
            index += 1;
        };
        files := newTrie;
        return #ok(());
    };

    public shared(msg) func deleteUnsubmittedFile(fileId: Text): async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_ ) {
            return #err(#NotAuthorized);
        };
        let trieIter = Trie.iter(unsubmittedFiles);
        let trieSize = Trie.size(unsubmittedFiles);
        var trieArray = Iter.toArray(trieIter);
        var newTrie : JournalTypes.Files = Trie.empty();
        var index = 0;
        while(index < trieSize){
            let fileWithName = trieArray[index];
            let fileName = fileWithName.0;
            let file = fileWithName.1;
            if(fileName != fileId){
                let (updatedNewTrie, oldValueForThisKey) = Trie.put(
                    newTrie,
                    textKey(fileName),
                    Text.equal,
                    file
                );
                newTrie := updatedNewTrie;
            };
            index += 1;
        };
        unsubmittedFiles := newTrie;
        return #ok(());
    };

    public shared(msg) func submitFiles() : async Result.Result<(), JournalTypes.Error> {
        if( Principal.toText(callerId) != mainCanisterId_ ) {
            return #err(#NotAuthorized);
        };
        let updatedFiles = Trie.merge(files, unsubmittedFiles, Text.equal);
        files := updatedFiles;
        unsubmittedFiles := Trie.empty();
        return #ok(());
    };

    public shared(msg) func uploadFileChunk(fileId: Text, chunkId : Nat, blobChunk : Blob) : async Result.Result<(Text), JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_ ) {
            return #err(#NotAuthorized);
        };
        let updatedUnsubmittedFiles = Trie.put2D(
            unsubmittedFiles,
            textKey(fileId),
            Text.equal,
            natKey(chunkId),
            Nat.equal,
            blobChunk
        );
        unsubmittedFiles := updatedUnsubmittedFiles;
        return #ok(fileId); 
    };

    public shared(msg) func readJournal() : 
    async ([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio, Text) {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_ ) {
            throw Error.reject("Unauthorized access.");
        };
        let journalAsArray = Iter.toArray(Trie.iter(journalV2));
        let journalCanisterPrincipal = Principal.fromActor(this); 
        return ((journalAsArray), biography, Principal.toText(journalCanisterPrincipal));
    };

    public shared(msg) func getEntriesToBeSent() : async ([(Nat, JournalTypes.JournalEntry)]) {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
            throw Error.reject("Unauthorized access.");
        };

        let journalIter = Trie.iter(journalV2);
        let entriesToBeSentBuffer = Buffer.Buffer<(Nat, JournalTypes.JournalEntry)>(1);

        Iter.iterate<(Nat, JournalTypes.JournalEntry)>(journalIter, func(x : (Nat, JournalTypes.JournalEntry), _index) {
            if(x.1.sent == false){
                if(Time.now() >= x.1.unlockTime){
                    entriesToBeSentBuffer.add(x);
                    let updatedJournalEntry = {
                        entryTitle = x.1.entryTitle;
                        text = x.1.text;
                        location = x.1.location;
                        date = x.1.date;
                        unlockTime = x.1.unlockTime;
                        sent = true;
                        read = x.1.read;
                        draft = x.1.draft;
                        emailOne = x.1.emailOne;
                        emailTwo = x.1.emailTwo;
                        emailThree = x.1.emailThree;
                        filesMetaData  = x.1.filesMetaData;

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

    public shared(msg) func readJournalEntry(key : Nat): async Result.Result<JournalTypes.JournalEntry, JournalTypes.Error> {

        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
            return #err(#NotAuthorized);
        };

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
                
                let updatedEntryValue : JournalTypes.JournalEntry = {
                    entryTitle = entryValue.entryTitle;
                    text = entryValue.text;
                    location = entryValue.location;
                    date = entryValue.date;
                    unlockTime = entryValue.unlockTime;
                    sent = true;
                    read = true;
                    draft = entryValue.draft;
                    emailOne = entryValue.emailOne;
                    emailTwo = entryValue.emailTwo;
                    emailThree = entryValue.emailThree;
                    filesMetaData  = entryValue.filesMetaData;

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

    public shared(msg) func readJournalFileChunk (fileId : Text, chunkId: Nat) : async Result.Result<(Blob),JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
           return #err(#NotAuthorized);
        };

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

    public shared(msg) func readJournalFileSize (fileId : Text) : async Result.Result<(Nat),JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
           return #err(#NotAuthorized);
        };

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

    public shared(msg) func updateBio(bio: JournalTypes.Bio) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error>{
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
           return #err(#NotAuthorized);
        };
        biography := bio;
        #ok(biography);
    };

    public shared(msg) func updatePhotos(photos: [JournalTypes.FileMetaData]) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error>{
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
           return #err(#NotAuthorized);
        };
        let updatedBiography : JournalTypes.Bio = {
            name = biography.name;
            dob = biography.dob;
            pob = biography.pob;
            dedications = biography.dedications;
            preface = biography.preface;
            photos = photos;
        };
        biography := updatedBiography;
        #ok(biography);
    };

    public shared(msg) func updateJournalEntry(key: Nat, journalEntry: JournalTypes.JournalEntryInput) : 
    async Result.Result<([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio),JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
           return #err(#NotAuthorized);
        };
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
                    unlockTime = journalEntry.unlockTime;
                    sent = false;
                    read = false;
                    draft = journalEntry.draft;
                    emailOne = journalEntry.emailOne;
                    emailTwo = journalEntry.emailTwo;
                    emailThree = journalEntry.emailThree;
                    filesMetaData  = journalEntry.filesMetaData;

                };

                let (newJournal, oldValueForThisKey) = Trie.put(
                    journalV2,
                    natKey(key),
                    Nat.equal,
                    completeEntry
                );

                journalV2:= newJournal;
                let journalAsArray = Iter.toArray(Trie.iter(journalV2));
                #ok((journalAsArray, biography));
            }
        }

    };

    public shared(msg) func updateJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk : Blob) : async Result.Result<(),JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
           return #err(#NotAuthorized);
        };
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

    public shared(msg) func deleteJournalEntry(key: Nat) : 
    async Result.Result<([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio),JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
           return #err(#NotAuthorized);
        };
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
                let journalAsArray = Iter.toArray(Trie.iter(journalV2));
                #ok((journalAsArray), biography);

            };
        };

    };

    public shared(msg) func deleteJournalEntryFile(fileId: Text) : async Result.Result<(),JournalTypes.Error> {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
           return #err(#NotAuthorized);
        };
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
        if( Principal.toText(callerId) != mainCanisterId_) {
            throw Error.reject("Unauthorized access.");
        };

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

    public shared(msg) func readWalletTxHistory() : async [(Nat,JournalTypes.Transaction)] {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
            throw Error.reject("Unauthorized access.");
        };
        
        Iter.toArray(Trie.iter(txHistory));
    };

    public shared(msg) func updateTxHistory(tx : JournalTypes.Transaction) : async () {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
            throw Error.reject("Unauthorized access.");
        };
        let (newTxHistoryTrie, oldValueForThisKey) = Trie.put(
            txHistory,
            natKey(txTrieIndex),
            Nat.equal,
            tx
        );
        txHistory := newTxHistoryTrie;
        txTrieIndex += 1; 
    };

    private func userAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query(msg) func canisterAccount() : async Account.AccountIdentifier {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId_) {
            throw Error.reject("Unauthorized access.");
        };
        userAccountId()
    };

    public shared(msg) func canisterBalance() : async Ledger.ICP {
        let callerId = msg.caller;
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(callerId) !=  Principal.toText(canisterId)
            and Principal.toText(callerId) != mainCanisterId_
        ) {
            throw Error.reject("Unauthorized access.");
        };
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