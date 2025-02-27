import Ledger "../../NNS/Ledger";
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
import Account "../../Serializers/Account";
import Option "mo:base/Option";
import UserTypes "types";
import HashMap "mo:base/HashMap";
import NotificationsTypes "../../Types/Notifications/types";
import AnalyticsTypes "../../Analytics/types";


shared(msg) actor class User () = this {

    private stable var journalArray : [(Nat, UserTypes.JournalEntry)] = [];
    private var journalMap : UserTypes.JournalMap = HashMap.fromIter<Nat, UserTypes.JournalEntry>(Iter.fromArray(journalArray), Iter.size(Iter.fromArray(journalArray)), Nat.equal, Hash.hash);
    private stable var filesArray : [(Text, UserTypes.File)] = [];
    private var filesMap : UserTypes.FileMap = HashMap.fromIter<Text, UserTypes.File>(Iter.fromArray(filesArray), Iter.size(Iter.fromArray(filesArray)), Text.equal, Text.hash);
    private stable var txHistoryArray : [(Nat, UserTypes.Transaction)] = [];
    private var txHistoryMap : UserTypes.TxHistoryMap = HashMap.fromIter<Nat, UserTypes.Transaction>(Iter.fromArray(txHistoryArray), Iter.size(Iter.fromArray(txHistoryArray)), Nat.equal, Hash.hash);
    private stable var balancesArray : AnalyticsTypes.BalancesArray = [];
    private var balancesMap : AnalyticsTypes.BalancesMap = HashMap.fromIter<Text, AnalyticsTypes.Balances>(Iter.fromArray(balancesArray), Iter.size(Iter.fromArray(balancesArray)), Text.equal, Text.hash);
    private stable var biography : UserTypes.Bio = { name = ""; dob = null; pob = ""; dedications = ""; preface = ""; photos = []; };
    private stable var tokenBalances : UserTypes.Balances = { icp = {e8s = 0}; eth = {e8s = 0}; btc = {e8s = 0}; icp_staked = {e8s = 0}; };
    private stable var notifications : NotificationsTypes.Notifications = [];
    private stable var mainCanisterId_ : Text = "null"; 
    private stable var journalEntryIndex : Nat = 0;
    private var txFee : Nat64 = 10_000;
    private var balance = Cycles.balance();
    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public shared({caller}) func wallet_balance() : async Nat {
        if( Principal.toText(caller) != mainCanisterId_ ) { throw Error.reject("Unauthorized access."); };
        return balance
    };

    // Return the cycles received up to the capacity allowed
    public shared func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let accepted = Cycles.accept<system>(amount);
        { accepted = Nat64.fromNat(accepted) };
    };

    public shared({caller}) func setMainCanisterPrincipalId() : async Result.Result<(),UserTypes.Error> {
        if(mainCanisterId_ != "null"){ return #err(#NotAuthorized); };
        mainCanisterId_ := Principal.toText(caller);
        return #ok(());
    };

    public shared({caller}) func createEntry() : 
    async Result.Result<([UserTypes.JournalEntryExportKeyValuePair]), UserTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_ ) { return #err(#NotAuthorized); };
        journalMap.put(journalEntryIndex, { UserTypes.JournalEntryDefault with timeStarted = Time.now(); });
        journalEntryIndex += 1;
        let journalAsArray = Iter.toArray(journalMap.entries());
        let journalAsArrayExport = mapJournalEntriesArrayToExport(journalAsArray);
        #ok(journalAsArrayExport);
    };

    public shared({caller}) func deleteFile(fileId: Text): async Result.Result<(), UserTypes.Error>{
        if( Principal.toText(caller) != mainCanisterId_ ) { return #err(#NotAuthorized); };
        filesMap.delete(fileId);
        return #ok(());
    };

    public shared({caller}) func uploadFileChunk(fileId: Text, chunkId : Nat, blobChunk : Blob) : async Result.Result<(Text), UserTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_ ) { return #err(#NotAuthorized); };
        let fileOption = filesMap.get(fileId);
        let fileTrie = Option.get(fileOption, Trie.empty());
        let (newTrie, _) = Trie.put(
            fileTrie,
            natKey(chunkId),
            Nat.equal,
            blobChunk
        );
        filesMap.put(fileId, newTrie);
        return #ok(fileId); 
    };

    public query({caller}) func readJournal() : 
    async {
        journalAsArrayExport: [UserTypes.JournalEntryExportKeyValuePair];  
        biography: UserTypes.Bio;  
        canisterPrincipal: Text;
        cyclesBalance: Nat;
    } {
        if( Principal.toText(caller) != mainCanisterId_ ) { throw Error.reject("Unauthorized access."); };
        let journalAsArray = Iter.toArray(journalMap.entries());
        let journalAsArrayExport = mapJournalEntriesArrayToExport(journalAsArray);
        let journalCanisterPrincipal = Principal.fromActor(this); 
        balance := Cycles.balance();
        return {
            journalAsArrayExport; 
            biography; 
            canisterPrincipal = Principal.toText(journalCanisterPrincipal);
            cyclesBalance = balance;
        };
    };

    public shared({caller}) func updateNotifications(): async (){
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        let notificationsBuffer = Buffer.fromArray<NotificationsTypes.Notification>(notifications);
        let journalIter = journalMap.entries();
        let currentTime = Time.now();
        Iter.iterate<UserTypes.JournalEntryKeyValuePair>(
            journalIter, 
            func((key, entry) : UserTypes.JournalEntryKeyValuePair, _index) {
            let { notified; timeOfUnlock; title } = entry;
            let timeOfUnlock_ = Option.get(timeOfUnlock, currentTime - 1);
            if(notified == false and currentTime > timeOfUnlock_){
                let text_notification = Text.concat("Journal Entry Unlocked: ", title);
                notificationsBuffer.add({key = ?key; text = text_notification});
                let updatedJournalEntry = { entry with notified = true; };
                journalMap.put(key,updatedJournalEntry);
            };
        });
        notifications := Buffer.toArray(notificationsBuffer);
    };

    public query({caller}) func getNotifications(): async NotificationsTypes.Notifications{
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        return notifications;
    };

    public shared({caller}) func clearNotifications(): async (){
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        notifications := [];
    };

    public shared({caller}) func markJournalEntryAsRead(key : Nat): 
    async Result.Result<(), UserTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entry = journalMap.get(key);
        switch(entry){
            case null{ #err(#NotFound); };
            case(? entryValue){
                let updatedEntryValue : UserTypes.JournalEntry = { entryValue with notified = true; read = true; };
                journalMap.put(key,updatedEntryValue);
                #ok(());
            };
        }
    };

    public query({caller}) func readJournalFileChunk (fileId : Text, chunkId: Nat) : async Result.Result<(Blob),UserTypes.Error> {
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

    public query({caller}) func readJournalFileSize (fileId : Text) : async Result.Result<(Nat),UserTypes.Error> {
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

    public shared({caller}) func updateBio(bio: UserTypes.Bio) : async Result.Result<(UserTypes.Bio), UserTypes.Error>{
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        biography := bio;
        #ok(biography);
    };

    public shared({caller}) func updatePhotos(photos: [UserTypes.FileMetaData]) : async Result.Result<(UserTypes.Bio), UserTypes.Error>{
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let updatedBiography : UserTypes.Bio = {
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

    public shared({caller}) func updateJournalEntry(key: Nat, journalEntry: UserTypes.JournalEntry) : 
    async Result.Result<([UserTypes.JournalEntryExportKeyValuePair]),UserTypes.Error> {
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
                #ok(journalAsArrayExport);
            }
        }

    };

    public shared({caller}) func submitEntry(key: Nat) : 
    async Result.Result<[UserTypes.JournalEntryExportKeyValuePair], UserTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entry = journalMap.get(key);
        switch(entry){
            case null{ #err(#NotFound) ;};
            case(? v){
                let updatedEntry = { v with submitted = true; timeSubmited = ?Time.now()};
                journalMap.put(key,updatedEntry);
                let journalAsArray = Iter.toArray(journalMap.entries());
                let journalAsArrayExport = mapJournalEntriesArrayToExport(journalAsArray);
                #ok(journalAsArrayExport);
            }
        }
    } ;

    public shared({caller}) func deleteJournalEntry(key: Nat) : 
    async Result.Result<(),UserTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entry = journalMap.get(key);

        switch(entry){
            case null{ #err(#NotFound); };
            case (? _){
                journalMap.delete(key);
                let journalAsArray = Iter.toArray(journalMap.entries());
                ignore mapJournalEntriesArrayToExport(journalAsArray);
                #ok(());
            };
        };

    };

    public shared({caller}) func deleteJournalEntryFile(fileId: Text) : async Result.Result<(),UserTypes.Error> {
        if( Principal.toText(caller) != mainCanisterId_) { return #err(#NotAuthorized); };
        let entryFiles = filesMap.get(fileId);
        switch(entryFiles){
            case null{ #err(#NotFound); };
            case (? _){
                filesMap.delete(fileId);
                #ok(());
            };
        };
    };

    public shared({caller}) func saveCurrentBalances(treasuryBalances: UserTypes.Balances) : async () {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        let thisCanisterIcpBalance = await ledger.account_balance({ account = userAccountId() });
        //will need to retreive the proper balances of the other currencies once they've been integrated
        let thisCanisterBtcBalance = {e8s: Nat64 = 0};
        let thisCanisterEth = {e8s: Nat64 = 0};
        let balances = {
            icp = {e8s: Nat64 = thisCanisterIcpBalance.e8s + treasuryBalances.icp.e8s}; 
            icp_staked = treasuryBalances.icp_staked;
            btc = {e8s: Nat64 = thisCanisterBtcBalance.e8s + treasuryBalances.btc.e8s}; 
            eth = {e8s: Nat64 = thisCanisterEth.e8s + treasuryBalances.eth.e8s;};
        };
        balancesMap.put(Int.toText(Time.now()), balances);
    };

    public query({caller}) func readBalancesHistory() : async AnalyticsTypes.BalancesArray{
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        return Iter.toArray(balancesMap.entries());
    };

    public shared({caller}) func transferICP( amount: Nat64, recipientIdentifier: UserTypes.RecipientIdentifier) : async {amountSent: Nat64} {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };

        func performTransfer(amountToSend: Nat64, recipientIdentifier: UserTypes.RecipientIdentifier) : 
        async {#icrc1_transfer: Ledger.Result; #transfer: Ledger.Result_5} {
            switch(recipientIdentifier) {
                case(#PrincipalAndSubaccount(recipient, subaccount)) {
                    let res_ = await ledger.icrc1_transfer({
                        memo = null;
                        from_subaccount = null;
                        to = {owner = recipient; subaccount};
                        amount = Nat64.toNat(amountToSend);
                        fee = ?Nat64.toNat(txFee);
                        created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                    });
                    #icrc1_transfer(res_);
                };
                case(#AccountIdentifier(accountId)) {
                    let res_ = await ledger.transfer({
                        memo = Nat64.fromNat(0);
                        from_subaccount = null;
                        to = accountId;
                        amount = { e8s = amountToSend};
                        fee = { e8s = txFee };
                        created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
                    });
                    #transfer(res_);
                };
            };
        };
        var amountSent = amount;
        let res = await performTransfer(amount, recipientIdentifier);
        ignore updateTokenBalances_();

        switch (res) {
            case(#icrc1_transfer(res_)){
                switch(res_) {
                    case(#Ok(_)) {return {amountSent};};
                    case(#Err(#InsufficientFunds { balance })) {
                        if(balance < Nat64.toNat(txFee)){ return {amountSent: Nat64 = 0}; };
                        amountSent := Nat64.fromNat(balance) - txFee;
                        let res = await performTransfer(amountSent, recipientIdentifier);
                        switch (res) {
                            case(#icrc1_transfer(#Err(_))){ return {amountSent: Nat64 = 0}; };
                            case(#transfer(#Err(_))){ return {amountSent: Nat64 = 0}; };
                            case(#icrc1_transfer(_)){ return {amountSent}; };
                            case(#transfer(_)){ return {amountSent}; }
                        }
                            
                    };
                    case(#Err(_)) { return {amountSent: Nat64 = 0}; };
                };
            };
            case(#transfer(res_)){
                switch(res_) {
                    case(#Ok(_)) { return {amountSent}; };
                    case(#Err(#InsufficientFunds { balance })) {
                        if(balance.e8s < txFee){ return {amountSent: Nat64 = 0}; };
                        amountSent := balance.e8s - txFee;
                        let res = await performTransfer(amountSent, recipientIdentifier);
                        switch (res) {
                            case(#icrc1_transfer(#Err(_))){ return {amountSent: Nat64 = 0}; };
                            case(#transfer(#Err(_))){ return {amountSent: Nat64 = 0}; };
                            case(#icrc1_transfer(_)){ return {amountSent}; };
                            case(#transfer(_)){ return {amountSent}; }
                        } 
                    };
                    case(#Err(_)) { return {amountSent: Nat64 = 0}; };
                };
            };
        };
    };

    public query({caller}) func readWalletTxHistory() : async [(Nat,UserTypes.Transaction)] {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        Iter.toArray(txHistoryMap.entries());
    };

    public shared({caller}) func updateTxHistory(timeStamp: Nat64, tx : UserTypes.Transaction) : async () {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        txHistoryMap.put(Nat64.toNat(timeStamp), tx);
        ignore updateTokenBalances_();
    };

    private func updateTokenBalances_() : async () {
        let icp = await ledger.account_balance({ account = userAccountId() });
        //will have to do the same for the btc and eth ledgers
        tokenBalances := {tokenBalances with icp };
    };

    private func userAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query({caller}) func canisterAccount() : async Account.AccountIdentifier {
        if( Principal.toText(caller) != mainCanisterId_) { throw Error.reject("Unauthorized access."); };
        userAccountId()
    };

    public query({caller}) func canisterBalance() : async Ledger.ICP {
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(caller) !=  Principal.toText(canisterId)
            and Principal.toText(caller) != mainCanisterId_
        ) { throw Error.reject("Unauthorized access."); };
        return tokenBalances.icp;
    };

    private func mapJournalEntriesArrayToExport(journalAsArray: [UserTypes.JournalEntryKeyValuePair]) : 
    [UserTypes.JournalEntryExportKeyValuePair] {
        let currentTime = Time.now();
        let journalAsArrayExport = Array.map<UserTypes.JournalEntryKeyValuePair, UserTypes.JournalEntryExportKeyValuePair>(
            journalAsArray, func ((key, entry): UserTypes.JournalEntryKeyValuePair) : UserTypes.JournalEntryExportKeyValuePair{
                let timeOfUnlock = Option.get(entry.timeOfUnlock, currentTime - 1);
                let entryExport = { entry with locked = entry.submitted and currentTime < timeOfUnlock; };
                return (key, entryExport);
        });
        return journalAsArrayExport;
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