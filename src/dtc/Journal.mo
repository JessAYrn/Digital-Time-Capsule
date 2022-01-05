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


shared(msg) actor class Journal (principal : Principal){
    let callerId = msg.caller;

    type JournalEntry = {
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


    private stable var journal : Trie.Trie<Nat, JournalEntry> = Trie.empty();

    private stable var files : Trie.Trie2D<Text,Text,Blob> = Trie.empty();

    private stable var biography : Bio = {
        name = "";
        dob = "";
        pob = "";
        dedications = "";
        preface = "";
    };

    private stable var journalEntryIndex : Nat = 0;

    private var capacity = 1000000000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private var balance = Cycles.balance();

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

    public func createEntry( journalEntry : JournalEntryInput) : async Result.Result<Trie.Trie<Nat, JournalEntry>, Error> {

        let completeJournalEntry = {
            entryTitle = journalEntry.entryTitle;
            text = journalEntry.text;
            location = journalEntry.location;
            date = journalEntry.date;
            lockTime = journalEntry.lockTime;
            unlockTime = Time.now() + nanosecondsInADay * daysInAMonth * journalEntry.lockTime;
            sent = false;
            emailOne = journalEntry.emailOne;
            emailTwo = journalEntry.emailTwo;
            emailThree = journalEntry.emailThree;
        };
        
        let (newJournal, oldJournal) = Trie.put(
            journal,
            natKey(journalEntryIndex),
            Nat.equal,
            completeJournalEntry
        );

        journal := newJournal;

        journalEntryIndex += 1;

        #ok(journal);
            
        

    };

    public func createFile(fileId: Text ,chunkId : Text, blobChunk : Blob) : async Result.Result<(), Error> {

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
                    textKey(chunkId),
                    Text.equal,
                    blobChunk
                );
                files := updatedFiles;
                #ok(());
            };
            case (? fileExists){
                #err(#AlreadyExists);
            };
        };
    };

    public func readJournal() : async ([(Nat,JournalEntry)], Bio) {
        let journalAsArray = Iter.toArray(Trie.iter(journal));
        return ((journalAsArray), biography);
    };

    public func getEntriesToBeSent() : async ([(Nat, JournalEntry)]) {
        let journalIter = Trie.iter(journal);
        let entriesToBeSentBuffer = Buffer.Buffer<(Nat, JournalEntry)>(1);

        Iter.iterate<(Nat, JournalEntry)>(journalIter, func(x : (Nat, JournalEntry), _index) {
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
                        emailOne = x.1.emailOne;
                        emailTwo = x.1.emailTwo;
                        emailThree = x.1.emailThree;
                    };

                    let (newJournal, oldJournal) = Trie.put(
                        journal,
                        natKey(x.0),
                        Nat.equal,
                        updatedJournalEntry
                    );

                    journal := newJournal;
                };
            };
        });

        let entriestoBeSentArray = entriesToBeSentBuffer.toArray();
        return entriestoBeSentArray;
    };

    public func readJournalEntry(key : Nat): async Result.Result<JournalEntry, Error> {
        let entry = Trie.find(
            journal,
            natKey(key),
            Nat.equal
        );


        switch(entry){
            case null{
                #err(#NotFound);
            };
            case(? entryValue){
                #ok(entryValue);
            };
        }
    };

    public func readJournalFile (fileId : Text) : async Result.Result<(Trie.Trie<Text,Blob>),Error> {

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
                #ok(existingFile);
            };
        };
    };

    public func updateBio(bio: Bio) : async Result.Result<(), Error>{
        biography := bio;
        #ok(());
    };



    public func updateJournalEntry(key: Nat, journalEntry: JournalEntryInput) : async Result.Result<Trie.Trie<Nat,JournalEntry>,Error> {

        let entry = Trie.find(
            journal,
            natKey(key),
            Nat.equal
        );

        switch(entry){
            case null{
                #err(#NotFound);
            };
            case (? v){

                let completeJournalEntry = {
                    entryTitle = journalEntry.entryTitle;
                    text = journalEntry.text;
                    location = journalEntry.location;
                    date = journalEntry.date;
                    lockTime = journalEntry.lockTime;
                    unlockTime = v.unlockTime;
                    sent = false;
                    emailOne = journalEntry.emailOne;
                    emailTwo = journalEntry.emailTwo;
                    emailThree = journalEntry.emailThree;
                };

                let (newJournal, oldEntryValue) = Trie.put(
                    journal,
                    natKey(key),
                    Nat.equal,
                    completeJournalEntry
                );

                journal := newJournal;

                #ok(newJournal);

            }
        }

    };

    public func updateJournalEntryFile(fileId: Text, chunkId: Text, blobChunk : Blob) : async Result.Result<(),Error> {

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
                    textKey(chunkId),
                    Text.equal,
                    blobChunk
                );

                files := updatedFiles;
                #ok(());

            }
        }

    };



    public func deleteJournalEntry(key: Nat) : async Result.Result<Trie.Trie<Nat,JournalEntry>,Error> {
        let entry = Trie.find(
            journal,
            natKey(key),
            Nat.equal,
        );

        switch(entry){
            case null{
                #err(#NotFound);
            };
            case (? v){
                let updatedJournal = Trie.replace(
                    journal,
                    natKey(key),
                    Nat.equal,
                    null
                );

                journal := updatedJournal.0;
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