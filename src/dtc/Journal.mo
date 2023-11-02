import Ledger "Ledger/Ledger";
import LedgerCandid "Ledger/LedgerCandid";
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
import Account "Ledger/Account";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import JournalTypes "Types/Journal/types";
import HashMap "mo:base/HashMap";
import MainTypes "Types/Main/types";
import NotificationsTypes "Types/Notifications/types";
import IC "Types/IC/types";
import AnalyticsTypes "Types/Analytics/types";
import GovernanceHelperMethods "Modules/Main/GovernanceHelperMethods";
import NnsCyclesMinting "Ledger/NnsCyclesMinting";

shared(msg) actor class Journal (principal : Principal) = this {

    private stable var journalArray : [(Nat, JournalTypes.JournalEntry)] = [];

    private var journalMap : JournalTypes.JournalMap = HashMap.fromIter<Nat, JournalTypes.JournalEntry>(
        Iter.fromArray(journalArray), 
        Iter.size(Iter.fromArray(journalArray)), 
        Nat.equal,
        Hash.hash
    );

    private stable var filesArray : [(Text, JournalTypes.File)] = [];

    private var filesMap : JournalTypes.FileMap = HashMap.fromIter<Text, JournalTypes.File>(
        Iter.fromArray(filesArray), 
        Iter.size(Iter.fromArray(filesArray)), 
        Text.equal,
        Text.hash
    );

    private stable var txHistoryArray : [(Nat, JournalTypes.Transaction)] = [];

    private var txHistoryMap : JournalTypes.TxHistoryMap = HashMap.fromIter<Nat, JournalTypes.Transaction>(
        Iter.fromArray(txHistoryArray), 
        Iter.size(Iter.fromArray(txHistoryArray)), 
        Nat.equal,
        Hash.hash
    );

    private stable var balancesArray : AnalyticsTypes.BalancesArray = [];

    private var balancesMap : AnalyticsTypes.BalancesMap = HashMap.fromIter<Text, AnalyticsTypes.Balances>(
        Iter.fromArray(balancesArray), 
        Iter.size(Iter.fromArray(balancesArray)), 
        Text.equal,
        Text.hash
    );
    
    private stable var biography : JournalTypes.Bio = {
        name = "";
        dob = null;
        pob = "";
        dedications = "";
        preface = "";
        photos = [];
    };

    private stable var dataUsageInBytes = 0;

    private stable var notifications : NotificationsTypes.Notifications = [];

    private stable var mainCanisterId_ : Text = "null"; 

    private stable var journalEntryIndex : Nat = 0;

    private var txFee : Nat64 = 10_000;

    private var capacity = 1000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private var balance = Cycles.balance();

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private let oneICP : Nat64 = 100_000_000;

    private let ic : IC.Self = actor "aaaaa-aa";

    public shared({caller}) func wallet_balance() : async Nat {
        if( Principal.toText(caller) != mainCanisterId_ ) { throw Error.reject("Unauthorized access."); };
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

    public shared({caller}) func setMainCanisterPrincipalId() : async Result.Result<(),JournalTypes.Error> {
        if(mainCanisterId_ != "null"){ return #err(#NotAuthorized); };
        mainCanisterId_ := Principal.toText(caller);
        ignore updateDataUsageInMegaBytes();
        return #ok(());
    };

    public shared({caller}) func createEntry() : 
    async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_ ) { return #err(#NotAuthorized); };
        if( not isStorageSpaceAvailable()) return #err(#NoRemainingStorage);
        journalMap.put(journalEntryIndex, { JournalTypes.JournalEntryDefault with timeStarted = Time.now(); });
        journalEntryIndex += 1;
        let journalAsArray = Iter.toArray(journalMap.entries());
        let journalAsArrayExport = mapJournalEntriesArrayToExport(journalAsArray);
        ignore updateDataUsageInMegaBytes();
        #ok(journalAsArrayExport);
    };

    public shared({caller}) func deleteFile(fileId: Text): async Result.Result<(), JournalTypes.Error>{
        if( Principal.toText(caller) != mainCanisterId_ ) { return #err(#NotAuthorized); };
        filesMap.delete(fileId);
        ignore updateDataUsageInMegaBytes();
        return #ok(());
    };

    public shared({caller}) func uploadFileChunk(fileId: Text, chunkId : Nat, blobChunk : Blob) : async Result.Result<(Text), JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_ ) { return #err(#NotAuthorized); };
        if( not isStorageSpaceAvailable()) return #err(#NoRemainingStorage);
        let fileOption = filesMap.get(fileId);
        let fileTrie = Option.get(fileOption, Trie.empty());
        let (newTrie, oldValue) = Trie.put(
            fileTrie,
            natKey(chunkId),
            Nat.equal,
            blobChunk
        );
        filesMap.put(fileId, newTrie);
        ignore updateDataUsageInMegaBytes();
        return #ok(fileId); 
    };

    public shared({caller}) func readJournal() : 
    async ([JournalTypes.JournalEntryExportKeyValuePair], JournalTypes.Bio, Text) {
        if( Principal.toText(caller) != mainCanisterId_ ) { throw Error.reject("Unauthorized access."); };
        let journalAsArray = Iter.toArray(journalMap.entries());
        let currentTime = Time.now();
        let journalAsArrayExport = mapJournalEntriesArrayToExport(journalAsArray);
        let journalCanisterPrincipal = Principal.fromActor(this); 
        return (journalAsArrayExport, biography, Principal.toText(journalCanisterPrincipal));
    };

    public shared({caller}) func updateNotifications(): async (){
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        let notificationsBuffer = Buffer.fromArray<NotificationsTypes.Notification>(notifications);
        let journalIter = journalMap.entries();
        let currentTime = Time.now();
        Iter.iterate<JournalTypes.JournalEntryKeyValuePair>(
            journalIter, 
            func((key, entry) : JournalTypes.JournalEntryKeyValuePair, _index) {
            let { notified; timeOfUnlock; title } = entry;
            let timeOfUnlock_ = Option.get(timeOfUnlock, currentTime - 1);
            if(notified == false and currentTime > timeOfUnlock_){
                let text_notification = Text.concat("Journal Entry Unlocked: ", title);
                notificationsBuffer.add({key = ?key; text = text_notification});
                let updatedJournalEntry = { entry with notified = true; };
                journalMap.put(key,updatedJournalEntry);
            };
        });
        notifications := notificationsBuffer.toArray();
        ignore updateDataUsageInMegaBytes();
    };

    public query({caller}) func getNotifications(): async NotificationsTypes.Notifications{
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        return notifications;
    };

    public shared({caller}) func clearNotifications(): async (){
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        notifications := [];
        ignore updateDataUsageInMegaBytes();
    };

    public shared({caller}) func markJournalEntryAsRead(key : Nat): 
    async Result.Result<(), JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entry = journalMap.get(key);
        switch(entry){
            case null{ #err(#NotFound); };
            case(? entryValue){
                let updatedEntryValue : JournalTypes.JournalEntry = { entryValue with notified = true; read = true; };
                journalMap.put(key,updatedEntryValue);
                ignore updateDataUsageInMegaBytes();
                #ok(());
            };
        }
    };

    public shared({caller}) func readJournalFileChunk (fileId : Text, chunkId: Nat) : async Result.Result<(Blob),JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };

        let file = filesMap.get(fileId);

        switch(file){
            case null{ #err(#NotFound); };
            case (? existingFile){
                let existingFileChunk = Trie.find(
                    existingFile,
                    natKey(chunkId),
                    Nat.equal
                );
                switch(existingFileChunk){
                    case null{ #err(#NotFound); };
                    case (? existingChunk){ #ok(existingChunk); }
                };
            };
        };
    };

    public shared({caller}) func readJournalFileSize (fileId : Text) : async Result.Result<(Nat),JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let file = filesMap.get(fileId);
        switch(file){
            case null{ #err(#NotFound); };
            case (? existingFile){
                let existingFileArraySize = Iter.size(Trie.iter(existingFile));
                #ok(existingFileArraySize);
            };
        };
    };

    public shared({caller}) func updateBio(bio: JournalTypes.Bio) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error>{
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        biography := bio;
        ignore updateDataUsageInMegaBytes();
        #ok(biography);
    };

    public shared({caller}) func updatePhotos(photos: [JournalTypes.FileMetaData]) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error>{
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let updatedBiography : JournalTypes.Bio = {
            name = biography.name;
            dob = biography.dob;
            pob = biography.pob;
            dedications = biography.dedications;
            preface = biography.preface;
            photos = photos;
        };
        biography := updatedBiography;
        ignore updateDataUsageInMegaBytes();
        #ok(biography);
    };

    public shared({caller}) func updateJournalEntry(key: Nat, journalEntry: JournalTypes.JournalEntry) : 
    async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]),JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entry = journalMap.get(key);

        switch(entry){
            case null{ #err(#NotFound); };
            case (? v){
                let { submitted } = v;
                if(submitted){ return #err(#NotAuthorized) };
                let completeEntry  = { journalEntry with notified = false; read = false; };
                journalMap.put(key,completeEntry);
                let journalAsArray = Iter.toArray(journalMap.entries());
                let journalAsArrayExport = mapJournalEntriesArrayToExport(journalAsArray);
                ignore updateDataUsageInMegaBytes();
                #ok(journalAsArrayExport);
            }
        }

    };

    public shared({caller}) func submitEntry(key: Nat) : 
    async Result.Result<[JournalTypes.JournalEntryExportKeyValuePair], JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entry = journalMap.get(key);
        switch(entry){
            case null{ #err(#NotFound) ;};
            case(? v){
                let updatedEntry = { v with submitted = true; timeSubmited = ?Time.now()};
                journalMap.put(key,updatedEntry);
                let journalAsArray = Iter.toArray(journalMap.entries());
                let journalAsArrayExport = mapJournalEntriesArrayToExport(journalAsArray);
                ignore updateDataUsageInMegaBytes();
                #ok(journalAsArrayExport);
            }
        }
    } ;

    public shared({caller}) func deleteJournalEntry(key: Nat) : 
    async Result.Result<(),JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entry = journalMap.get(key);

        switch(entry){
            case null{ #err(#NotFound); };
            case (? v){
                let updatedJournal = journalMap.delete(key);
                let journalAsArray = Iter.toArray(journalMap.entries());
                let journalAsArrayExport = mapJournalEntriesArrayToExport(journalAsArray);
                ignore updateDataUsageInMegaBytes();
                #ok(());
            };
        };

    };

    public shared({caller}) func deleteJournalEntryFile(fileId: Text) : async Result.Result<(),JournalTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entryFiles = filesMap.get(fileId);
        switch(entryFiles){
            case null{ #err(#NotFound); };
            case (? v){
                filesMap.delete(fileId);
                ignore updateDataUsageInMegaBytes();
                #ok(());
            };
        };
    };

    public shared({caller}) func saveCurrentBalances() : async () {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        let icp = await canisterBalance();
        //will need to retreive the proper balances of the other currencies once they've been integrated
        let icp_staked = {e8s: Nat64 = 0};
        let btc = {e8s: Nat64 = 0};
        let eth = {e8s: Nat64 = 0};
        let balances = {icp; icp_staked; btc; eth;};
        let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
        let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
        let {xdr_permyriad_per_icp} = data;
        let xdrs = GovernanceHelperMethods.computeTotalXdrs({balances; xdr_permyriad_per_icp});
        balancesMap.put(Int.toText(Time.now()), {balances with xdrs});
    };

    public query({caller}) func readBalancesHistory() : async AnalyticsTypes.BalancesArray{
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        return Iter.toArray(balancesMap.entries());
    };

    public shared({caller}) func transferICP(amount: Nat64, recipientAccountId: Account.AccountIdentifier) : async Bool {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
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

            Debug.print("Paid reward to " # debug_show Principal.fromActor(this) # " in block " # debug_show blockIndex);
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

    public shared({caller}) func readWalletTxHistory() : async [(Nat,JournalTypes.Transaction)] {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        Iter.toArray(txHistoryMap.entries());
    };

    public shared({caller}) func updateTxHistory(timeStamp: Nat64, tx : JournalTypes.Transaction) : async () {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        txHistoryMap.put(Nat64.toNat(timeStamp), tx);
        ignore updateDataUsageInMegaBytes();
    };

    private func userAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query({caller}) func canisterAccount() : async Account.AccountIdentifier {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        userAccountId()
    };

    public shared({caller}) func canisterBalance() : async Ledger.ICP {
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(caller) !=  Principal.toText(canisterId)
            and Principal.toText(caller) != mainCanisterId_
        ) { throw Error.reject("Unauthorized access."); };
        await ledger.account_balance({ account = userAccountId() })
    };

    private func mapJournalEntriesArrayToExport(journalAsArray: [JournalTypes.JournalEntryKeyValuePair]) : 
    [JournalTypes.JournalEntryExportKeyValuePair] {
        let currentTime = Time.now();
        let journalAsArrayExport = Array.map<JournalTypes.JournalEntryKeyValuePair, JournalTypes.JournalEntryExportKeyValuePair>(
            journalAsArray, func ((key, entry): JournalTypes.JournalEntryKeyValuePair) : JournalTypes.JournalEntryExportKeyValuePair{
                let timeOfUnlock = Option.get(entry.timeOfUnlock, currentTime - 1);
                let entryExport = { entry with locked = entry.submitted and currentTime < timeOfUnlock; };
                return (key, entryExport);
        });
        return journalAsArrayExport;
    };

    private func updateDataUsageInMegaBytes(): async (){
        let {memory_size} = await ic.canister_status({canister_id = Principal.fromActor(this)});
        dataUsageInBytes := memory_size;
    };

    private func isStorageSpaceAvailable(): Bool{
        let threshold : Int = 2 * JournalTypes.ONE_GIGA_BYTE - 2 * JournalTypes.ONE_MEGA_BYTE;
        return dataUsageInBytes < threshold;
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };

    system func preupgrade() {
        journalArray := Iter.toArray(journalMap.entries());
        filesArray := Iter.toArray(filesMap.entries());
        txHistoryArray := Iter.toArray(txHistoryMap.entries());
        balancesArray := Iter.toArray(balancesMap.entries());
    };

    system func postupgrade() {
        journalArray := [];
        filesArray := [];
        txHistoryArray := [];
        balancesArray := [];
    };

}