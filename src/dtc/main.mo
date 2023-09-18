import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Trie "mo:base/Trie";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Result "mo:base/Result";
import Principal "mo:base/Principal"; 
import Cycles "mo:base/ExperimentalCycles";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Ledger "Ledger/Ledger";
import Account "Ledger/Account";
import JournalTypes "Journal/journal.types";
import MainMethods "Main/MainHelperMethods";
import JournalHelperMethods "Main/JournalHelperMethods";
import MainTypes "Main/types";
import TxHelperMethods "Main/TransactionHelperMethods";
import CanisterManagementMethods "Main/CanisterManagementMethods";
import Manager "Manager/Manager";
import AssetCanister "AssetCanister/AssetCanister";
import NotificationProtocolMethods "Main/NotificationProtocolMethods";
import NotificationsTypes "Main/types.notifications";
import IC "IC/ic.types";
import Timer "mo:base/Timer";

shared actor class User() = this {

    private stable var daoMetaData : MainTypes.DaoMetaData = MainTypes.DEFAULT_DAO_METADATA;

    private stable var userProfilesArray : [(Principal, MainTypes.UserProfile)] = [];

    private stable var everyFiveSecondsTimerId: {id: Nat; active: Bool} = {id = 0; active = false;};

    private stable var dailyTimerId: {id: Nat; active: Bool;} = {id = 0; active = false;};

    private stable var backendCanisterUpdateScheduled: Bool = false;

    private var userProfilesMap : MainTypes.UserProfilesMap = HashMap.fromIter<Principal, MainTypes.UserProfile>(
        Iter.fromArray(userProfilesArray), 
        Iter.size(Iter.fromArray(userProfilesArray)), 
        Principal.equal,
        Principal.hash
    );

    private stable var startIndexForBlockChainQuery : Nat64 = 3_512_868;

    public query({caller}) func hasAccount() : async Bool {
        let userProfile = userProfilesMap.get(caller);
        switch(userProfile){ case null { return false}; case(?profile){ return true;}};
    };
    
    public shared({ caller }) func create () : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {
        let amountAccepted = await MainMethods.create(caller, userProfilesMap, daoMetaData);
        let updatedDaoMetaData = await CanisterManagementMethods.removeFromRequestsList([Principal.toText(caller)], daoMetaData);
        switch(amountAccepted){
            case(#ok(amount)){ daoMetaData := updatedDaoMetaData; return #ok(amount); };
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

    public shared({caller}) func createJournalEntry() : 
    async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        let result = await JournalHelperMethods.createJournalEntry(caller, userProfilesMap);
        return result;
    };

    public shared({ caller }) func markJournalEntryAsRead(entryKey: JournalTypes.EntryKey) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.markJournalEntryAsRead(caller, userProfilesMap, entryKey);
        return result;
    };

    public shared({caller}) func updateJournalEntry(entryKey : JournalTypes.EntryKey, entry : JournalTypes.JournalEntry) : 
    async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        let result = await JournalHelperMethods.updateJournalEntry(caller, userProfilesMap, entry, entryKey);
        return result;
    };

    public shared({ caller }) func submitJournalEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<[JournalTypes.JournalEntryExportKeyValuePair], JournalTypes.Error> {
        let result = await JournalHelperMethods.submitJournalEntry(caller, userProfilesMap, entryKey);
        return result;
    };

    public shared({ caller }) func deleteJournalEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.deleteJournalEntry(caller, userProfilesMap, entryKey);
        return result;
    };

    public shared({caller}) func deleteFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.deleteFile(caller, userProfilesMap, fileId);
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
        await MainTypes.ledger.account_balance({ account = myAccountId() })
    };

    public shared(msg) func getPrincipalsList() : async [Principal] {
        let callerId = msg.caller;
        let result = await CanisterManagementMethods.getPrincipalsList(callerId, userProfilesMap, daoMetaData);
        return result;
    };

    public shared({caller}) func grantAccess(principals : [Text]) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != daoMetaData.nftOwner){ return #err(#NotAuthorized); };
        let updatedDaoMetaData = await CanisterManagementMethods.grantAccess(principals, daoMetaData);
        switch(updatedDaoMetaData){
            case(#ok(metaData)){ daoMetaData := metaData; return #ok(metaData.requestsForAccess); };
            case(#err(e)){ return #err(e); };
        };
    };

    public shared({caller}) func updateApprovalStatus(principals: [Text], newApprovalStatus: Bool) : 
    async Result.Result<(MainTypes.ProfilesMetaData), JournalTypes.Error>{
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != daoMetaData.nftOwner){ return #err(#NotAuthorized); };
        CanisterManagementMethods.updateApprovalStatus(principals, userProfilesMap, newApprovalStatus);
        let profilesApprovalStatuses = CanisterManagementMethods.getProfilesMetaData(userProfilesMap);
        return #ok(profilesApprovalStatuses);
    };

    public shared({caller}) func removeFromRequestsList(principals: [Text]) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != daoMetaData.nftOwner){ return #err(#NotAuthorized); };
        let updatedDaoMetaDataList = await CanisterManagementMethods.removeFromRequestsList(principals, daoMetaData);
        daoMetaData := updatedDaoMetaDataList;
        return #ok(updatedDaoMetaDataList.requestsForAccess);
    };

    public shared({caller}) func configureApp(frontEndPrincipal : Text, nftId: Int ) : async Result.Result<(), JournalTypes.Error> {
        if(
            daoMetaData.frontEndPrincipal == "Null" or 
            daoMetaData.nftId == -1 or 
            daoMetaData.managerCanisterPrincipal == "Null" or 
            daoMetaData.treasuryCanisterPrincipal == "Null"
        ){
            let backEndPrincipal = Principal.toText(Principal.fromActor(this));
            let updatedMetaData = await CanisterManagementMethods.configureApp( backEndPrincipal, frontEndPrincipal, nftId, daoMetaData);
            daoMetaData := updatedMetaData;
            #ok(());
        } else { return #err(#NotAuthorized); };
    };

    public shared({caller}) func authorizePrinicpalToViewAssets(prinicpal: Principal): async () {
        assert(Principal.toText(caller) == daoMetaData.nftOwner);
        let frontEndPrincipal = Principal.fromText(daoMetaData.frontEndPrincipal);
        let result = await CanisterManagementMethods.authorizePrinicpalToViewAssets(prinicpal, frontEndPrincipal);
    };

    public shared(msg) func getAssetCanisterAuthorizedPrincipals() : async [Principal] {
        let assetCanister: AssetCanister.Interface = actor(daoMetaData.frontEndPrincipal);
        let result = await assetCanister.list_authorized();
    };

    public shared({caller}) func toggleAcceptRequest() : async  Result.Result<(MainTypes.DaoMetaData), JournalTypes.Error>{
        let result = CanisterManagementMethods.toggleAcceptRequest(caller, daoMetaData);
        switch(result){
            case(#err(e)){ return #err(e); };
            case(#ok(updatedMetaData)){ daoMetaData := updatedMetaData; return #ok(updatedMetaData);}
        };
    };

    public shared({caller}) func toggleCyclesSaveMode() : async MainTypes.DaoMetaData{
        let updatedMetaData = await CanisterManagementMethods.toggleCyclesSaveMode(caller, daoMetaData);
        if(updatedMetaData.cyclesSaveMode) deactivateTimers()
        else activateTimers();
        daoMetaData := updatedMetaData;
        return updatedMetaData;
    };

    public shared({caller}) func getRequestingPrincipals() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != daoMetaData.nftOwner){ return #err(#NotAuthorized); } 
        else { return #ok(daoMetaData.requestsForAccess) };
    };

    public shared({caller}) func requestApproval() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        let result = CanisterManagementMethods.requestApproval(caller, daoMetaData);
        switch(result){
            case (#err(e)){ return #err(e)};
            case (#ok(updatedDaoMetaData)){ 
                daoMetaData := updatedDaoMetaData;
                return #ok(updatedDaoMetaData.requestsForAccess)
            };
        };
    };

    public shared(msg) func getCanisterCyclesBalances() : async MainTypes.CanisterCyclesBalances{
        let cyclesBalance_backend = Cycles.balance();
        let balances = await CanisterManagementMethods.getCanisterCyclesBalances(cyclesBalance_backend, daoMetaData);
        return balances;
    };

    public shared({caller}) func getCanisterData() : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {
        let cyclesBalance_backend = Cycles.balance();
        let daoMetaDataPackagedForExport = await CanisterManagementMethods.getCanisterData(caller, daoMetaData, cyclesBalance_backend, userProfilesMap);
        return daoMetaDataPackagedForExport;
    };

    public shared({ caller }) func upgradeApp_exceptForBackendCanister(): async MainTypes.DaoMetaData{
        if(Principal.toText(caller) != daoMetaData.nftOwner){ throw Error.reject("Unauthorized Access"); };
        let managerCanister: Manager.Manager = actor(daoMetaData.managerCanisterPrincipal);
        await managerCanister.loadNextRelease();
        try{
            await CanisterManagementMethods.installCode_managerCanister(daoMetaData);
            let result_0 = await managerCanister.installCode_frontendCanister(daoMetaData);
            let result_1 = await managerCanister.installCode_journalCanisters(Iter.toArray(userProfilesMap.entries()));
            let result_2 = await managerCanister.installCode_treasuryCanister(daoMetaData);
            ignore managerCanister.scheduleBackendCanisterToBeUpdated();
            backendCanisterUpdateScheduled := true;
        } catch (e) {
            //revert all canisters to previous stable canister versions
        };
        return daoMetaData;
    };

    public func getCanisterCongtrollers(canisterPrincipal: Principal) : async ([Text]) {
        let canisterStatus = await MainTypes.self.canister_status({ canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let controllersOption = settings.controllers;
        var controllers = Option.get(controllersOption, daoMetaData.defaultControllers);
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
        let result = await CanisterManagementMethods.toggleSupportMode(caller, daoMetaData);
        switch(result){
            case (#ok(metaData)){ daoMetaData := metaData; return #ok();};
            case (#err(e)){ return #err(e)};
        }
    };

    public shared({ caller }) func registerOwner() : async  Result.Result<(), JournalTypes.Error>{
        let result = await CanisterManagementMethods.registerOwner(caller, daoMetaData);
        switch(result){
            case(#ok(metaData)){ daoMetaData := metaData; return #ok(());};
            case(#err(e)){ return #err(e)};
        };
    };

    public shared({ caller }) func getNotifications(): async NotificationsTypes.Notifications{
        let notifications = await NotificationProtocolMethods.notifyOfNewStableRelease(daoMetaData);
        let notifications_ = await NotificationProtocolMethods.appendNotificationsFromJournal(caller, userProfilesMap, notifications);
        return notifications_;
    };

    public shared({ caller }) func clearJournalNotifications(): async (){
        await NotificationProtocolMethods.clearJournalNotifications(caller, userProfilesMap);
    };

    public shared({caller}) func heartBeat(): async (){
        let cyclesBalance_backend = Cycles.balance();
        ignore NotificationProtocolMethods.updateUserCanisterNotifications(userProfilesMap);
        let updatedMetaData = await CanisterManagementMethods.heartBeat(cyclesBalance_backend, daoMetaData, userProfilesMap);
        daoMetaData := updatedMetaData;
    };  

    private func heartBeat_unshared(): async () {
        let cyclesBalance_backend = Cycles.balance();
        ignore NotificationProtocolMethods.updateUserCanisterNotifications(userProfilesMap);
        let updatedMetaData = await CanisterManagementMethods.heartBeat(cyclesBalance_backend, daoMetaData, userProfilesMap);
        daoMetaData := updatedMetaData;
    };

    private func revertAppToPreviousStableVersion(): async () {
        
    };

    let {recurringTimer; cancelTimer} = Timer;

    private func activateTimers() : () {
        let timerId_daily = recurringTimer(#seconds (24 * 60 * 60), heartBeat_unshared);
        let timerId_everyFiveSeconds = recurringTimer(#seconds (5), updateUsersTxHistory);
        everyFiveSecondsTimerId := {id = timerId_everyFiveSeconds; active = true};
        dailyTimerId := {id = timerId_daily; active = true;};
    };

    private func deactivateTimers() : () {
        cancelTimer(everyFiveSecondsTimerId.id);
        cancelTimer(dailyTimerId.id);
        dailyTimerId := {dailyTimerId with active = false};
        everyFiveSecondsTimerId := { everyFiveSecondsTimerId with active = false };
    };
    
    system func preupgrade() { userProfilesArray := Iter.toArray(userProfilesMap.entries()); };

    system func postupgrade() { userProfilesArray:= []; backendCanisterUpdateScheduled:= false; };

    private  func key(x: Principal) : Trie.Key<Principal> { return {key = x; hash = Principal.hash(x)}; };

    private func natKey(x: Nat) : Trie.Key<Nat> { return {key = x; hash = Hash.hash(x)} };

    private func textKey(x: Text) : Trie.Key<Text> { return {key = x; hash = Text.hash(x)} };
}