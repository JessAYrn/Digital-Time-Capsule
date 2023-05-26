import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Trie "mo:base/Trie";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Principal "mo:base/Principal"; 
import Time "mo:base/Time";
import Cycles "mo:base/ExperimentalCycles";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import Ledger "Ledger/Ledger";
import LedgerCandid "Ledger/LedgerCandid";
import Journal "Journal/Journal";
import Account "Ledger/Account";
import JournalTypes "Journal/journal.types";
import MainMethods "Main/MainHelperMethods";
import JournalHelperMethods "Main/JournalHelperMethods";
import MainTypes "Main/types";
import TxHelperMethods "Main/TransactionHelperMethods";
import CanisterManagementMethods "Main/CanisterManagementMethods";
import NftCollection "NftCollection/NftCollection";
import Support "SupportCanisterIds/SupportCanisterIds";
import IC "IC/ic.types";
import Hex "Ledger/Hex";
import ManagerCanister "Manager/Manager";
import ManagerTypes "Manager/WasmStore";
import Manager "Manager/Manager";
import AssetCanister "AssetCanister/AssetCanister";
import WasmStore "Manager/WasmStore";
import NotificationProtocolMethods "Main/NotificationProtocolMethods";

shared actor class User() = this {

    private var isLocal : Bool = false;

    private let ic : IC.Self = actor "aaaaa-aa";

    private stable var userProfilesArray : [(Principal, MainTypes.UserProfile)] = [];

    private var userProfilesMap : MainTypes.UserProfilesMap = HashMap.fromIter<Principal, MainTypes.UserProfile>(
        Iter.fromArray(userProfilesArray), 
        Iter.size(Iter.fromArray(userProfilesArray)), 
        Principal.equal,
        Principal.hash
    );

    private stable var notifications : MainTypes.Notifications = [];

    private stable var supportMode : Bool = false;

    private stable var defaultControllers : [Principal] = [];

    private stable var canisterData : MainTypes.CanisterData = {
        managerCanisterPrincipal = "Null";
        frontEndPrincipal = "Null";
        backEndPrincipal = "Null";
        lastRecordedBackEndCyclesBalance = 0;
        backEndCyclesBurnRatePerDay = 0;
        nftOwner = "Null";
        nftId = -1;
        acceptingRequests = true;
        lastRecordedTime = 0;
    };

    private stable var requestsForAccess: MainTypes.RequestsForAccess = [];

    private stable var startIndexForBlockChainQuery : Nat64 = 3_512_868;

    private var Gas: Nat64 = 10000;
    
    private var Fee : Nat64 = 9980000 + Gas;

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private let ledgerC : LedgerCandid.Interface = actor(LedgerCandid.CANISTER_ID);

    private var balance = Cycles.balance();

    private var oneICP : Nat64 = 100_000_000;

    private var capacity = 1000000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private let heartBeatInterval : Nat64 = 100;

    private let heartBeatInterval_refill : Nat64 = 25000;
    
    private stable var heartBeatCount : Nat64 = 0;

    public shared({ caller }) func create () : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {
        let amountAccepted = await MainMethods.create(caller, requestsForAccess, userProfilesMap, isLocal, defaultControllers, canisterData);
        let updatedRequestsList = await CanisterManagementMethods.removeFromRequestsList(caller, requestsForAccess);
        switch(amountAccepted){
            case(#ok(amount)){ requestsForAccess := updatedRequestsList; return #ok(amount); };
            case(#err(e)){ return #err(e); };
        };
    };

    public shared({ caller }) func updateProfile(profile: MainTypes.ProfileInput) : async Result.Result<(),JournalTypes.Error> {
        let result = await MainMethods.updateProfile(caller, userProfilesMap, profile);
        switch(result){
            case(#ok(_)){ #ok(()); };
            case(#err(e)){ #err(e); };
        };
    };

    public shared({ caller }) func delete() : async Result.Result<(), JournalTypes.Error> {
        let result = await MainMethods.delete(caller, userProfilesMap);
        switch(result){
            case(#ok(_)){ #ok(()); };
            case(#err(e)){ #err(e); };
        };
    };
    
    public shared({ caller }) func readJournal () : 
    async Result.Result<(MainTypes.JournalData), JournalTypes.Error> {
        let result = await JournalHelperMethods.readJournal(caller, userProfilesMap);
        return result; 
    };

    public shared({ caller }) func readWalletData() : async Result.Result<({ balance : Ledger.ICP; address: [Nat8]; } ), JournalTypes.Error> {
        let result = await JournalHelperMethods.readWalletData(caller, userProfilesMap);
        return result;
    };

    public shared({ caller }) func readEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<JournalTypes.JournalEntry, JournalTypes.Error> {
        let result = await JournalHelperMethods.readEntry(caller, userProfilesMap, entryKey);
        return result;
    };

    public shared({ caller }) func readEntryFileChunk(fileId: Text, chunkId: Nat) : async Result.Result<(Blob),JournalTypes.Error>{
        let result = await JournalHelperMethods.readEntryFileChunk(caller, userProfilesMap, fileId, chunkId);
        return result;
    };

    public shared({ caller }) func readEntryFileSize(fileId: Text) : async Result.Result<(Nat),JournalTypes.Error>{
        let result = await JournalHelperMethods.readEntryFileSize(caller, userProfilesMap, fileId);
        return result;
    };

    public shared({ caller }) func updateBio(bio: JournalTypes.Bio) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let result = await JournalHelperMethods.updateBio(caller, userProfilesMap, bio);
        return result;
    };

    public shared({caller}) func updatePhotos(photos: [JournalTypes.FileMetaData]) : 
    async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let result = await JournalHelperMethods.updatePhotos(caller, userProfilesMap, photos);
        return result;
    };

    public shared({caller}) func updateJournalEntry(entryKey : ?JournalTypes.EntryKey, entry : ?JournalTypes.JournalEntryInput) : 
    async Result.Result<([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio), JournalTypes.Error> {
        let result = await JournalHelperMethods.updateJournalEntry(caller, userProfilesMap, entryKey, entry);
        return result;
    };

    public shared({caller}) func deleteUnsubmittedFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.deleteUnsubmittedFile(caller, userProfilesMap, fileId);
        return result;
    };

    public shared({caller}) func deleteSubmittedFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.deleteSubmittedFile(caller, userProfilesMap, fileId);
        return result;
    };

    public shared({caller}) func submitFiles() : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.submitFiles(caller, userProfilesMap);
        return result;
    };

    public shared({caller}) func clearUnsubmittedFiles(): async Result.Result<(), JournalTypes.Error>{
        let result = await JournalHelperMethods.clearUnsubmittedFiles(caller, userProfilesMap);
        return result;
    };

    public shared({caller}) func uploadJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk: Blob): async Result.Result<(Text), JournalTypes.Error>{
        let result = await JournalHelperMethods.uploadJournalEntryFile(caller, userProfilesMap, fileId, chunkId, blobChunk);
        return result;
    };
    
    public shared({caller}) func transferICP(amount: Nat64, canisterAccountId: Account.AccountIdentifier) : async Result.Result<(), JournalTypes.Error> {
        let result = await TxHelperMethods.transferICP(caller, userProfilesMap, amount, canisterAccountId);
        return result;
    };

    public shared({caller}) func readTransaction() : async Result.Result<[(Nat, JournalTypes.Transaction)], JournalTypes.Error> {
        let result = await TxHelperMethods.readTransaction(caller, userProfilesMap);
        return result;
    };

    private func updateUsersTxHistory() : async () {
        let newStartIndexForNextQuery = await TxHelperMethods.updateUsersTxHistory(userProfilesMap, startIndexForBlockChainQuery);
        startIndexForBlockChainQuery := newStartIndexForNextQuery;
    };

    func myAccountId() : Account.AccountIdentifier {
        Account.accountIdentifier(Principal.fromActor(this), Account.defaultSubaccount())
    };

    public query func canisterAccount() : async Account.AccountIdentifier {
        myAccountId()
    };

    public func mainCanisterCyclesBalance() : async Nat {
        return Cycles.balance();
    };

    public func canisterBalance() : async Ledger.ICP {
        await ledger.account_balance({ account = myAccountId() })
    };

    public shared(msg) func getPrincipalsList() : async [Principal] {
        let callerId = msg.caller;
        let result = await CanisterManagementMethods.getPrincipalsList(callerId, userProfilesMap, canisterData);
        return result;
    };

    public shared({caller}) func grantAccess(principal : Text) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != canisterData.nftOwner){ return #err(#NotAuthorized); };
        let principalAsBlob = Principal.fromText(principal);
        let updatedCanisterData = await CanisterManagementMethods.grantAccess(principalAsBlob, requestsForAccess);
        switch(updatedCanisterData){
            case(#ok(data)){ requestsForAccess := data; return #ok(data); };
            case(#err(e)){ return #err(e); };
        };
    };

    public shared({caller}) func updateApprovalStatus(principal: Text, newApprovalStatus: Bool) : 
    async Result.Result<(MainTypes.ProfilesApprovalStatuses), JournalTypes.Error>{
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != canisterData.nftOwner){ return #err(#NotAuthorized); };
        let result = await CanisterManagementMethods.updateApprovalStatus(Principal.fromText(principal), userProfilesMap, newApprovalStatus);
        switch(result){
            case(#ok(_)){
                let profilesApprovalStatuses = CanisterManagementMethods.getProfilesMetaData(userProfilesMap);
                return #ok(profilesApprovalStatuses);
            };
            case(#err(e)){ return #err(e); }
        };
    };

    public shared({caller}) func removeFromRequestsList(principal: Text) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != canisterData.nftOwner){ return #err(#NotAuthorized); };
        let principalAsBlob = Principal.fromText(principal);
        let updatedRequestsList = await CanisterManagementMethods.removeFromRequestsList(principalAsBlob, requestsForAccess);
        requestsForAccess := updatedRequestsList;
        return #ok(updatedRequestsList);
    };

    public shared({caller}) func configureApp(frontEndPrincipal : Text, nftId: Int ) : async Result.Result<(), JournalTypes.Error> {
        if(canisterData.frontEndPrincipal == "Null" or canisterData.nftId == -1 or canisterData.managerCanisterPrincipal == "Null"){
            let backEndPrincipalAsPrincipal = Principal.fromActor(this);
            let backEndPrincipal = Principal.toText(backEndPrincipalAsPrincipal);
            let (updatedCanisterData, defaultControllers_) = await CanisterManagementMethods.configureApp( backEndPrincipal, frontEndPrincipal, nftId, canisterData);
            canisterData := updatedCanisterData;
            defaultControllers := defaultControllers_;
            #ok(());
        } else { return #err(#NotAuthorized); };
    };

    public shared({caller}) func authorizePrinicpalToViewAssets(prinicpal: Principal): async () {
        assert(Principal.toText(caller) == canisterData.nftOwner);
        let frontEndPrincipal = Principal.fromText(canisterData.frontEndPrincipal);
        let result = await CanisterManagementMethods.authorizePrinicpalToViewAssets(prinicpal, frontEndPrincipal);
    };

    public shared(msg) func getAssetCanisterAuthorizedPrincipals() : async [Principal] {
        let assetCanister: AssetCanister.Interface = actor(canisterData.frontEndPrincipal);
        let result = await assetCanister.list_authorized();
    };

    public shared(msg) func toggleAcceptRequest() : async  Result.Result<(MainTypes.CanisterData), JournalTypes.Error>{
        let callerId = msg.caller;
        let result = CanisterManagementMethods.toggleAcceptRequest(callerId, canisterData);
        switch(result){
            case(#err(e)){ return #err(e); };
            case(#ok(updatedCanisterData)){ canisterData := updatedCanisterData; return #ok(updatedCanisterData);}
        };
    };

    public shared({caller}) func getRequestingPrincipals() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != canisterData.nftOwner){ return #err(#NotAuthorized); } 
        else { return #ok(requestsForAccess) };
    };

    public shared({caller}) func requestApproval() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        if(canisterData.acceptingRequests == false){ return #err(#NotAcceptingRequests); };
        let callerIdAsText = Principal.toText(caller);
        let ArrayBuffer = Buffer.Buffer<(Text, MainTypes.Approved)>(1);
        var inListAlready = false;
        let requestsForAccessIter = Iter.fromArray(requestsForAccess);
        Iter.iterate<(Text, MainTypes.Approved)>(requestsForAccessIter, func (x : (Text, MainTypes.Approved), index: Nat){
            let (principalAsText, approved) = x;
            if(principalAsText == callerIdAsText){ inListAlready := true };
            ArrayBuffer.add((principalAsText, approved));
        });
        if(inListAlready == false){ ArrayBuffer.add((callerIdAsText, false)); };
        requestsForAccess := ArrayBuffer.toArray();
        return #ok(requestsForAccess);
    };

    public shared(msg) func getCanisterCyclesBalances() : async MainTypes.CanisterCyclesBalances{
        let cyclesBalance_backend = Cycles.balance();
        let balances = await CanisterManagementMethods.getCanisterCyclesBalances(cyclesBalance_backend, canisterData);
        return balances;
    };

    public shared({caller}) func getCanisterData() : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {
        let cyclesBalance_backend = Cycles.balance();
        let canisterDataPackagedForExport = await CanisterManagementMethods.getCanisterData(caller, canisterData, cyclesBalance_backend, supportMode, userProfilesMap);
        return canisterDataPackagedForExport;
    };

    private func setCyclesBurnRate() : (){
        let currentCylcesBalance : Nat = Cycles.balance();
        let updatedCanisterData = CanisterManagementMethods.setCyclesBurnRate(currentCylcesBalance, canisterData);
        canisterData := updatedCanisterData;
    };

    private func setLastRecordedBackEndCyclesBalance() : (){
        let currentCylcesBalance = Cycles.balance();
        let currentTime = Time.now();
        let updatedCanisterData = CanisterManagementMethods.setLastRecordedBackEndCyclesBalance(currentCylcesBalance, currentTime, canisterData);
        canisterData := updatedCanisterData;
    };

    public shared({ caller }) func upgradeApp_exceptForBackendCanister(): async ([AssetCanister.BatchOperationKind]){
        if(Principal.toText(caller) != canisterData.nftOwner){ throw Error.reject("Unauthorized Access"); };
        let managerCanister: Manager.Manager = actor(canisterData.managerCanisterPrincipal);
        await managerCanister.loadNextRelease();
        await CanisterManagementMethods.installCode_managerCanister(canisterData);
        let result_0 = await managerCanister.installCode_frontendCanister(canisterData);
        let result_1 = await managerCanister.installCode_journalCanisters(Iter.toArray(userProfilesMap.entries()));
        await managerCanister.allowUpdatesToBackendCanister();
        return result_0;
    };

    public shared({ caller }) func getCurrentReleaseVersion(): async Nat{
        if(canisterData.nftOwner != Principal.toText(caller)){ throw Error.reject("Not Authorized"); };
        let managerCanister: Manager.Manager = actor(canisterData.managerCanisterPrincipal);
        let version = await managerCanister.getCurrentReleaseVersion();
        return version;
    };

    public func getCanisterCongtrollers(canisterPrincipal: Principal) : async ([Text]) {
        let canisterStatus = await ic.canister_status({ canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let controllersOption = settings.controllers;
        var controllers = Option.get(controllersOption, defaultControllers);
        let ArrayBuffer = Buffer.Buffer<(Text)>(1);
        let controllersIter = Iter.fromArray(controllers);
        Iter.iterate<Principal>(controllersIter, func (x: Principal, index: Nat){
            let text = Principal.toText(x);
            ArrayBuffer.add(text);
        });
        let controllersAsTextArray = ArrayBuffer.toArray();
        return controllersAsTextArray;
    };

    public shared({caller}) func toggleSupportMode() : async Result.Result<(),JournalTypes.Error>{
        let result = await CanisterManagementMethods.toggleSupportMode(caller, canisterData, supportMode, defaultControllers);
        switch(result){
            case (#ok(boolean)){ supportMode := boolean; return #ok();};
            case (#err(e)){ return #err(e)};
        }
    };

    public shared({ caller }) func registerOwner() : async  Result.Result<(), JournalTypes.Error>{
        let result = await CanisterManagementMethods.registerOwner(isLocal, caller, canisterData, requestsForAccess);
        switch(result){
            case(#ok(canisterData_, requestsForAccess_)){
                canisterData := canisterData_;
                requestsForAccess := requestsForAccess_;
                return #ok(());
            };
            case(#err(e)){ return #err(e)};
        };
    };

    public shared({ caller }) func getNotifications(): async MainTypes.Notifications{
        let notifications_ = await NotificationProtocolMethods.appendNotificationsFromJournal(caller, userProfilesMap, notifications);
        return notifications_;
    };

    public shared({ caller }) func clearJournalNotifications(): async (){
        await NotificationProtocolMethods.clearJournalNotifications(caller, userProfilesMap);
    };

    public shared({ caller }) func clearBackendCanisterNotifications(): async(){
        if(Principal.toText(caller) != canisterData.nftOwner){ throw Error.reject("Not Authorized")};
        notifications := [];
    };

    private func updateNotifications(): async (){
        ignore NotificationProtocolMethods.updateUserCanisterNotifications(userProfilesMap);
        let result = await NotificationProtocolMethods.notifyOfNewStableRelease(canisterData, notifications);
        notifications := result;
    };

    private func refillCanisterCycles() : async () { let result = await MainMethods.refillCanisterCycles(userProfilesMap); };

    public func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = capacity - balance;
        let accepted = if (amount <= limit) amount else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        balance += accepted;
        { accepted = Nat64.fromNat(accepted) };
    };

    system func heartbeat() : async () {
        heartBeatCount += 1;
        if(Time.now() - canisterData.lastRecordedTime > nanosecondsInADay){
            setCyclesBurnRate();
            setLastRecordedBackEndCyclesBalance();
        };
        if(heartBeatCount % heartBeatInterval == 0){ ignore updateUsersTxHistory(); };
        if(heartBeatCount % heartBeatInterval_refill == 0){ 
            let result = ignore refillCanisterCycles(); 
            ignore updateNotifications();
        };
    };

    system func preupgrade() { userProfilesArray := Iter.toArray(userProfilesMap.entries()); };

    system func postupgrade() { userProfilesArray:= []; };

    private  func key(x: Principal) : Trie.Key<Principal> { return {key = x; hash = Principal.hash(x)}; };

    private func natKey(x: Nat) : Trie.Key<Nat> { return {key = x; hash = Hash.hash(x)} };

    private func textKey(x: Text) : Trie.Key<Text> { return {key = x; hash = Text.hash(x)} };
}