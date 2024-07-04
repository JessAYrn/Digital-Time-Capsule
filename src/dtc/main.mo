import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Result "mo:base/Result";
import Principal "mo:base/Principal"; 
import Cycles "mo:base/ExperimentalCycles";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Ledger "NNS/Ledger";
import Account "Serializers/Account";
import JournalTypes "Types/Journal/types";
import MainMethods "Modules/Main/MainHelperMethods";
import JournalHelperMethods "Modules/Main/JournalHelperMethods";
import MainTypes "Types/Main/types";
import TxHelperMethods "Modules/Main/TransactionHelperMethods";
import CanisterManagementMethods "Modules/Main/CanisterManagementMethods";
import Manager "Manager";
import NotificationProtocolMethods "Modules/Main/NotificationProtocolMethods";
import NotificationsTypes "Types/Notifications/types";
import IC "Types/IC/types";
import Timer "mo:base/Timer";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Blob "mo:base/Blob";
import GovernanceHelperMethods "Modules/Main/GovernanceHelperMethods";
import Treasury "Treasury";
import TreasuryTypes "Types/Treasury/types";
import NnsCyclesMinting "NNS/NnsCyclesMinting";
import TreasuryHelperMethods "Modules/Main/TreasuryHelperMethods";
import AnalyticsHelperMethods "Modules/Analytics/AnalyticsHelperMethods";
import Journal "Journal";
import SupportCanisterIds "SupportCanisterIds/SupportCanisterIds";
import MarketData "Modules/HTTPRequests/MarketData";
import AnalyticsTypes "Types/Analytics/types";
import Governance "NNS/Governance";


shared actor class User() = this {

    private stable var daoMetaData_v4 : MainTypes.DaoMetaData_V4 = MainTypes.DEFAULT_DAO_METADATA_V4;

    private stable var userProfilesArray_v2 : [(Principal, MainTypes.UserProfile_V2)] = [];

    private stable var proposalIndex: Nat = 0;

    private stable var proposalsArray: MainTypes.Proposals = [];

    private stable var xdr_permyriad_per_icp: Nat64 = 1;

    private stable var frontEndCanisterBalance: Nat = 1;

    private stable var quorum: Float = 0.125;

    private var maxNumberDaoMembers : Nat = 250;

    private var userProfilesMap_v2 : MainTypes.UserProfilesMap_V2 = HashMap.fromIter<Principal, MainTypes.UserProfile_V2>(
        Iter.fromArray(userProfilesArray_v2), 
        Iter.size(Iter.fromArray(userProfilesArray_v2)), 
        Principal.equal,
        Principal.hash
    );

    private var proposalsMap : MainTypes.ProposalsMap = HashMap.fromIter<Nat, MainTypes.Proposal>(
        Iter.fromArray(proposalsArray), 
        Iter.size(Iter.fromArray(proposalsArray)), 
        Nat.equal,
        Hash.hash
    );

    private stable var startIndexForBlockChainQuery : Nat64 = 7_356_011;

    private let txFee : Nat64 = 10_000;

    private let ic : IC.Self = actor "aaaaa-aa";

    public query({caller}) func hasAccount() : async Bool {
        let userProfile = userProfilesMap_v2.get(caller);
        switch(userProfile){ case null { return false}; case(?profile){ return true;}};
    };

    public query({caller}) func hasAccessGranted() : async Bool {
        let requestsForAccessMap = HashMap.fromIter<Text, MainTypes.Approved>(Iter.fromArray(daoMetaData_v4.requestsForAccess), Iter.size(Iter.fromArray(daoMetaData_v4.requestsForAccess)), Text.equal,Text.hash);
        switch(requestsForAccessMap.get(Principal.toText(caller))){ case null { return false}; case(?approved){ return approved;}};
    };
    
    public shared({ caller }) func create (userName: Text) : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {
        let amountAccepted = await MainMethods.create(caller, userName, userProfilesMap_v2, daoMetaData_v4);
        let updatedDaoMetaData = await CanisterManagementMethods.removeFromRequestsList([Principal.toText(caller)], daoMetaData_v4);
        switch(amountAccepted){
            case(#ok(amount)){ daoMetaData_v4 := updatedDaoMetaData; return #ok(amount); };
            case(#err(e)){ return #err(e); };
        };
    };

    public shared({ caller }) func delete() : async Result.Result<(), JournalTypes.Error> {
        let result = await MainMethods.delete(caller, userProfilesMap_v2);
        switch(result){ case(#ok(_)){ #ok(()); }; case(#err(e)){ #err(e); }; };
    };
    
    public composite query({ caller }) func readJournal () : async Result.Result<(MainTypes.JournalData), JournalTypes.Error> {
        let result = userProfilesMap_v2.get(caller);
        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId)); 
                let {journalAsArrayExport; biography; canisterPrincipal; cyclesBalance;} = await journal.readJournal();
                return #ok({ 
                    userJournalData = (journalAsArrayExport, biography); 
                    userName = v.userName; 
                    userPrincipal = Principal.toText(caller); 
                    rootCanisterPrincipal = canisterPrincipal; 
                    cyclesBalance;
                });
            };
        };   
    };

    public composite query({ caller }) func readWalletData() : async Result.Result<({ balance : Ledger.ICP; address: [Nat8]; } ), JournalTypes.Error> {
        let result = userProfilesMap_v2.get(caller);
        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId)); 
                let userBalance = await journal.canisterBalance();
                let userAccountId = await journal.canisterAccount();
                return #ok({ balance = userBalance; address = Blob.toArray(userAccountId); });
            };
        };
    };

    public composite query({ caller }) func readEntryFileChunk(fileId: Text, chunkId: Nat) : async Result.Result<(Blob),JournalTypes.Error>{
        let result = userProfilesMap_v2.get(caller);
        switch(result){
            case null{ #err(#NotFound); };
            case ( ? existingProfile){
                let journal: Journal.Journal = actor(Principal.toText(existingProfile.canisterId));
                let entryFile = await journal.readJournalFileChunk(fileId, chunkId);
                return entryFile;
            };
        };
    };

    public composite query({ caller }) func readEntryFileSize(fileId: Text) : async Result.Result<(Nat),JournalTypes.Error>{
        let result = userProfilesMap_v2.get(caller);
        switch(result){
            case null{ #err(#NotFound); };
            case ( ? existingProfile){
                let journal: Journal.Journal = actor(Principal.toText(existingProfile.canisterId));
                let entryFileSize = await journal.readJournalFileSize(fileId);
                return entryFileSize;
            };
        };
    };

    public shared({ caller }) func updateBio(bio: JournalTypes.Bio) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let result = await JournalHelperMethods.updateBio(caller, userProfilesMap_v2, bio); return result;
    };

    public shared({caller}) func updatePhotos(photos: [JournalTypes.FileMetaData]): async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let result = await JournalHelperMethods.updatePhotos(caller, userProfilesMap_v2, photos); return result;
    };

    public shared({caller}) func createJournalEntry(): async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        let result = await JournalHelperMethods.createJournalEntry(caller, userProfilesMap_v2); return result;
    };

    public shared({ caller }) func markJournalEntryAsRead(entryKey: JournalTypes.EntryKey) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.markJournalEntryAsRead(caller, userProfilesMap_v2, entryKey); return result;
    };

    public shared({caller}) func updateJournalEntry(entryKey : JournalTypes.EntryKey, entry : JournalTypes.JournalEntry) : 
    async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        let result = await JournalHelperMethods.updateJournalEntry(caller, userProfilesMap_v2, entry, entryKey); return result;
    };

    public shared({ caller }) func submitJournalEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<[JournalTypes.JournalEntryExportKeyValuePair], JournalTypes.Error> {
        let result = await JournalHelperMethods.submitJournalEntry(caller, userProfilesMap_v2, entryKey); return result;
    };

    public shared({ caller }) func deleteJournalEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.deleteJournalEntry(caller, userProfilesMap_v2, entryKey); return result;
    };

    public shared({caller}) func deleteFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.deleteFile(caller, userProfilesMap_v2, fileId); return result;
    };

    public shared({caller}) func uploadJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk: Blob): async Result.Result<(Text), JournalTypes.Error>{
        let result = await JournalHelperMethods.uploadJournalEntryFile(caller, userProfilesMap_v2, fileId, chunkId, blobChunk); return result;
    };
    
    public shared({caller}) func transferICP(amount: Nat64, canisterAccountId: Account.AccountIdentifier) : async Result.Result<({blockIndex: Nat64}), JournalTypes.Error> {
        let result = await TxHelperMethods.transferICP(caller, userProfilesMap_v2, amount, canisterAccountId); return result;
    };

    public composite query({caller}) func readTransaction() : async Result.Result<[(Nat, JournalTypes.Transaction)], JournalTypes.Error> {
        let result = userProfilesMap_v2.get(caller);
        switch(result){
            case null{ #err(#NotFound); }; 
            case ( ? profile){
                let userJournal : Journal.Journal = actor(Principal.toText(profile.canisterId));
                let tx = await userJournal.readWalletTxHistory();
                return #ok(tx);
            };
        };
    };

    var error : Error = Error.reject("nothing yet");

    private func updateUsersTxHistory() : async () {
        try{
            let newStartIndexForNextQuery = await TxHelperMethods.updateUsersTxHistory(userProfilesMap_v2, startIndexForBlockChainQuery, daoMetaData_v4);
            startIndexForBlockChainQuery := newStartIndexForNextQuery;
        } catch (e) {
            error := e;
        }
    };

    public query func getNumberOfErrors() : async Text { return Error.message(error)}; 

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

    public shared({caller}) func grantAccess(principals : [Text]) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedDaoMetaData = await CanisterManagementMethods.grantAccess(principals, daoMetaData_v4);
        switch(updatedDaoMetaData){
            case(#ok(metaData)){ daoMetaData_v4 := metaData; return #ok(metaData.requestsForAccess); };
            case(#err(e)){ return #err(e); };
        };
    };

    public shared({caller}) func updateApprovalStatus(principals: [Text], newApprovalStatus: Bool) : 
    async Result.Result<(MainTypes.ProfilesMetaData), JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
        if(not isAdmin){ return #err(#NotAuthorized); };
        CanisterManagementMethods.updateApprovalStatus(principals, userProfilesMap_v2, newApprovalStatus);
        let profilesApprovalStatuses = CanisterManagementMethods.getProfilesMetaData(userProfilesMap_v2);
        return #ok(profilesApprovalStatuses);
    };

    public shared({caller}) func removeFromRequestsList(principals: [Text]) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedDaoMetaDataList = await CanisterManagementMethods.removeFromRequestsList(principals, daoMetaData_v4);
        daoMetaData_v4 := updatedDaoMetaDataList;
        return #ok(updatedDaoMetaDataList.requestsForAccess);
    };

    private func createManagerCanister(): async () {
        let {managerCanisterPrincipal} = await CanisterManagementMethods.createManagerCanister(daoMetaData_v4);
        daoMetaData_v4 := {daoMetaData_v4 with managerCanisterPrincipal};
    };

    private func createTreasuryCanister(): async () {
        let {treasuryCanisterPrincipal} = await CanisterManagementMethods.createTreasuryCanister(daoMetaData_v4);
        let treasuryCanister : Treasury.Treasury = actor(treasuryCanisterPrincipal);
        ignore treasuryCanister.createTreasuryData(Principal.fromActor(treasuryCanister));
        daoMetaData_v4 := {daoMetaData_v4 with treasuryCanisterPrincipal};
    };
    
    private func createFrontEndCanister(): async () {
        let {frontEndPrincipal} = await CanisterManagementMethods.createUiCanister(daoMetaData_v4);
        daoMetaData_v4 := {daoMetaData_v4 with frontEndPrincipal};
    };

    public shared func configureApp(founder: Text, nftId: ?Nat) : async Result.Result<(), JournalTypes.Error> {
        let canConfigureApp = CanisterManagementMethods.canConfigureApp(daoMetaData_v4);
        if(not canConfigureApp){ return #err(#NotAuthorized); };
        daoMetaData_v4 := {daoMetaData_v4 with backEndPrincipal = Principal.toText(Principal.fromActor(this))};
        await createManagerCanister();
        let {backEndPrincipal; managerCanisterPrincipal} = daoMetaData_v4;
        let managerCanister : Manager.Manager = actor(managerCanisterPrincipal);
        await managerCanister.loadRelease();
        let defaultControllers = [Principal.fromText(backEndPrincipal), Principal.fromText(managerCanisterPrincipal)];
        let founderPrincipal = Principal.fromText(founder);
        let admin = [(Principal.toText(founderPrincipal), {percentage = 100})];
        daoMetaData_v4 := { daoMetaData_v4 with nftId; founder; admin; defaultControllers; };

        ignore createTreasuryCanister();
        ignore createFrontEndCanister();
        return #ok(());
    };

    public query func transform({response: IC.http_response}) : async IC.http_response {
      let transformed : IC.http_response = {
        status = response.status;
        body = response.body;
        headers = [];
      };
      transformed;
    };

    public shared func getCurrencyExchangeRate(unitCurrency: Text) : async IC.http_response_with_text {
        let {status; body; headers; } = await MarketData.getCurrencyExchangeRate(unitCurrency, transform);
        return {status; headers; body = Text.decodeUtf8(body)};
    };

    public shared({caller}) func toggleAcceptRequest() : async  Result.Result<(MainTypes.DaoMetaData_V4), JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedMetaData = { daoMetaData_v4 with acceptingRequests = not daoMetaData_v4.acceptingRequests; };
        daoMetaData_v4 := updatedMetaData; return #ok(updatedMetaData);
    };

    public query({caller}) func getRequestingPrincipals() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
        if(not isAdmin){ return #err(#NotAuthorized); }
        else { return #ok(daoMetaData_v4.requestsForAccess) };
    };

    public shared({caller}) func requestApproval() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        if(userProfilesMap_v2.size() >= maxNumberDaoMembers){ return #err(#MaxNumberOfDaoMembersReached); };
        let result = CanisterManagementMethods.requestApproval(caller, daoMetaData_v4);
        switch(result){
            case (#err(e)){ return #err(e)};
            case (#ok(updatedDaoMetaData)){ 
                daoMetaData_v4 := updatedDaoMetaData;
                return #ok(updatedDaoMetaData.requestsForAccess)
            };
        };
    };

    public composite query func getCanisterCyclesBalances() : async MainTypes.CanisterCyclesBalances{
        let currentCyclesBalance_backend = Cycles.balance();
        let managerCanister: Manager.Manager = actor(daoMetaData_v4.managerCanisterPrincipal);
        let treasuryCanister: Treasury.Treasury = actor(daoMetaData_v4.treasuryCanisterPrincipal);
        let currentCyclesBalance_frontend  = frontEndCanisterBalance;
        let currentCyclesBalance_treasury = await treasuryCanister.getCyclesBalance();
        let currentCyclesBalance_manager = await managerCanister.getCyclesBalance();
        return {currentCyclesBalance_backend; currentCyclesBalance_frontend; currentCyclesBalance_manager; currentCyclesBalance_treasury};
    };

    public composite query({caller}) func getCanisterData() : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {
        let profile = userProfilesMap_v2.get(caller);
        switch(profile){
            case null{ return #err(#NotAuthorized); };
            case (? existingProfile){
                let managerCanister : Manager.Manager = actor(daoMetaData_v4.managerCanisterPrincipal);
                let treasuryCanister: Treasury.Treasury = actor(daoMetaData_v4.treasuryCanisterPrincipal);
                let neuronsDataArray = await treasuryCanister.getNeuronsDataArray();
                let profilesMetaData = CanisterManagementMethods.getProfilesMetaData(userProfilesMap_v2);
                let currentVersions = await managerCanister.getCurrentVersions();
                let canisterDataPackagedForExport = {
                    daoMetaData_v4 with 
                    proposals = GovernanceHelperMethods.tallyAllProposalVotes({proposals = proposalsMap; neuronsDataArray; founder = daoMetaData_v4.founder; userProfilesMap = userProfilesMap_v2;});
                    isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
                    currentCyclesBalance_backend = Cycles.balance();
                    journalCount = userProfilesMap_v2.size();
                    profilesMetaData;
                    releaseVersionInstalled = currentVersions.currentVersionInstalled.number;
                    releaseVersionLoaded = currentVersions.currentVersionLoaded.number;
                };
                return #ok(canisterDataPackagedForExport);
            };
        };
    };

    public composite query({caller}) func getTreasuryData() : async Result.Result<TreasuryTypes.TreasuryDataExport, MainTypes.Error> {
        let userProfile = userProfilesMap_v2.get(caller);
        if(userProfile == null) return #err(#NotAuthorizedToAccessData);
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v4.treasuryCanisterPrincipal);
        let usersTreasuryDataArray = await treasuryCanister.getUsersTreasuryDataArray();
        let neurons = {icp = await treasuryCanister.getNeuronsDataArray()};
        let daoWalletBalance = await treasuryCanister.daoWalletIcpBalance();
        let daoIcpAccountId_blob = await treasuryCanister.canisterIcpAccountId(null);
        let {totalDeposits} = await treasuryCanister.getDaoTotalDeposits();
        let daoIcpAccountId = Blob.toArray(daoIcpAccountId_blob);
        let userPrincipal = Principal.toText(caller);
        return #ok({usersTreasuryDataArray; daoWalletBalance; daoIcpAccountId; neurons; userPrincipal; totalDeposits});
    };

    public shared({caller}) func depositIcpToTreasury(amount: Nat64) : async {blockIndex: Nat64} {
        let result = await TreasuryHelperMethods.depositIcpToTreasury(daoMetaData_v4, userProfilesMap_v2, caller, amount); return result;
    };

    public shared({caller}) func withdrawIcpFromTreasury(amount: Nat64) : async {blockIndex: Nat64} {
        let result = await TreasuryHelperMethods.withdrawIcpFromTreasury(daoMetaData_v4, userProfilesMap_v2, caller, amount); return result;
    };

    public shared({ caller }) func loadUpgrades(): async (){
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
        if(not isAdmin and not (Principal.toText(caller) == SupportCanisterIds.TechSupportPrincipal2 and daoMetaData_v4.supportMode)){ 
            throw Error.reject("Unauthorized Access"); 
        };
        await loadUpgrades_();
    };

    public shared({ caller }) func installUpgrades(): async (){
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
        if(not isAdmin and not (Principal.toText(caller) == SupportCanisterIds.TechSupportPrincipal2 and daoMetaData_v4.supportMode)){ 
            throw Error.reject("Unauthorized Access"); 
        };
        await installUpgrades_();
    };

    private func loadUpgrades_(): async (){
        let managerCanister: Manager.Manager = actor(daoMetaData_v4.managerCanisterPrincipal);
        await managerCanister.resetLoadProgress();
        await managerCanister.loadRelease();
    };

    private func installUpgrades_(): async (){
        let managerCanister: Manager.Manager = actor(daoMetaData_v4.managerCanisterPrincipal);
        let loadCompleted = await managerCanister.getIsLoadingComplete();
        if(not loadCompleted) throw Error.reject("Load not completed");
        try { await updateCanistersExceptBackend(); } 
        catch (e) {
            await managerCanister.loadPreviousRelease();
            let {setTimer} = Timer;  
            ignore setTimer<system>(#seconds(60 * 15), func(): async (){ await updateCanistersExceptBackend() });
            throw Error.reject("Upgrade Failed, no code changes have been implemented.")
        };
        ignore managerCanister.scheduleBackendCanisterToBeUpdated();
    };

    private func updateCanistersExceptBackend(): async (){
        let managerCanister: Manager.Manager = actor(daoMetaData_v4.managerCanisterPrincipal);
        await CanisterManagementMethods.installCode_managerCanister(daoMetaData_v4);
        ignore await managerCanister.installCode_frontendCanister(daoMetaData_v4, #upgrade(?{skip_pre_upgrade = ?false}));
        await managerCanister.installCode_journalCanisters(Iter.toArray(userProfilesMap_v2.entries()), #upgrade(?{skip_pre_upgrade = ?false}));
        await managerCanister.installCode_treasuryCanister(daoMetaData_v4, #upgrade(?{skip_pre_upgrade = ?false}));
    };

    public shared({caller}) func scheduleCanistersToBeUpdatedExceptBackend(): async () {
        if( Principal.toText(caller) != daoMetaData_v4.managerCanisterPrincipal) { throw Error.reject("Unauthorized access."); };
        let {setTimer} = Timer;
        ignore setTimer<system>(#nanoseconds(1), updateCanistersExceptBackend);
    };

    public shared({caller}) func toggleSupportMode() : async Result.Result<(),JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v4);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedMetaData = await CanisterManagementMethods.toggleSupportMode(daoMetaData_v4);
        daoMetaData_v4 := updatedMetaData;
        return #ok(());
    };

    public composite query({ caller }) func getNotifications(): async NotificationsTypes.Notifications{
        let userProfile = userProfilesMap_v2.get(caller);
        switch(userProfile){
            case null {throw Error.reject("user profile not found")};
            case(?profile){
                let managerCanister : Manager.Manager = actor(daoMetaData_v4.managerCanisterPrincipal);
                let userCanister: Journal.Journal = actor(Principal.toText(profile.canisterId));
                let userNotifications = await userCanister.getNotifications();
                let notificationsBuffer = Buffer.fromArray<NotificationsTypes.Notification>(userNotifications);
                let currentVersions = await managerCanister.getCurrentVersions();
                let nextStableVersion = await managerCanister.getWhatIsNextStableReleaseVersion();
                let text = Text.concat("New Stable Version Availabe: Version #", Nat.toText(nextStableVersion.number));
                if(nextStableVersion.number > currentVersions.currentVersionInstalled.number) notificationsBuffer.add({text; key = null});
                return Buffer.toArray(notificationsBuffer);
            };
        };
    };

    public shared({ caller }) func clearJournalNotifications(): async (){
        await NotificationProtocolMethods.clearJournalNotifications(caller, userProfilesMap_v2);
    };
    
    public composite query({ caller }) func retrieveUserBalances(): async AnalyticsTypes.BalancesArray {
        let userProfile = userProfilesMap_v2.get(caller);
        switch(userProfile){
            case null { throw Error.reject("No profile found for this principal")};
            case(?profile) {
                let userCanister : Journal.Journal = actor(Principal.toText(profile.canisterId));
                let balancesHistory = await userCanister.readBalancesHistory(); return balancesHistory;
            };
        };
    };

    public composite query({ caller }) func retrieveTreasuryBalances() : async AnalyticsTypes.BalancesArray {
        let userProfile = userProfilesMap_v2.get(caller);
        switch(userProfile){
            case null { throw Error.reject("No profile found for this principal")};
            case(?_){
                let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v4.treasuryCanisterPrincipal);
                let balancesHistory = await treasuryCanister.readBalancesHistory(); return balancesHistory;
            };
        };
    };

    public shared func heartBeat(): async (){
        let cyclesBalance_backend = Cycles.balance();
        ignore NotificationProtocolMethods.updateUserCanisterNotifications(userProfilesMap_v2);
        let updatedMetaData = await CanisterManagementMethods.heartBeat(cyclesBalance_backend, daoMetaData_v4, userProfilesMap_v2);
        daoMetaData_v4 := updatedMetaData;
    };  

    private func heartBeat_unshared(): async () {
        let cyclesBalance_backend = Cycles.balance();
        ignore NotificationProtocolMethods.updateUserCanisterNotifications(userProfilesMap_v2);
        ignore AnalyticsHelperMethods.saveCurrentBalances(userProfilesMap_v2, daoMetaData_v4);
        let updatedMetaData = await CanisterManagementMethods.heartBeat(cyclesBalance_backend, daoMetaData_v4, userProfilesMap_v2);
        daoMetaData_v4 := updatedMetaData;
    };

    private func heartBeat_hourly(): async () {
        let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
        let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
        let {xdr_permyriad_per_icp = xdr_permyriad_per_icp_} = data;
        let {cycles} = await ic.canister_status({ canister_id = Principal.fromText(daoMetaData_v4.frontEndPrincipal) });
        frontEndCanisterBalance := cycles;
        xdr_permyriad_per_icp := xdr_permyriad_per_icp_;
    };

    let {recurringTimer; setTimer} = Timer;

    public shared({caller}) func createProposal(action: MainTypes.ProposalActions): 
    async Result.Result<(MainTypes.Proposals),MainTypes.Error>{
        let callerProfile = userProfilesMap_v2.get(caller);
        if(callerProfile == null) return #err(#NotAuthorizedToCreateProposals);
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v4.treasuryCanisterPrincipal);
        let neuronsDataArray = await treasuryCanister.getNeuronsDataArray();
        let proposer = Principal.toText(caller); let votes = [(proposer, {adopt = true})];
        let timeInitiated = Time.now(); 
        let votingWindowInNanoseconds = 20 * 1_000_000_000;
        let timeVotingPeriodEnds = timeInitiated + votingWindowInNanoseconds;
        let executed = false;
        var voteTally = {yay = Nat64.fromNat(0); nay = Nat64.fromNat(0); total = Nat64.fromNat(0);};
        let proposal = {votes; action; proposer; timeInitiated; executed; voteTally; timeVotingPeriodEnds;};
        let votingResults = GovernanceHelperMethods.tallyVotes({ neuronsDataArray; proposal; founder = daoMetaData_v4.founder; userProfilesMap = userProfilesMap_v2; });
        proposalsMap.put(proposalIndex, {proposal with voteTally = votingResults} );
        let proposalId = proposalIndex;
        ignore setTimer<system>(#nanoseconds(votingWindowInNanoseconds), func(): async (){await finalizeProposalVotingPeriod(proposalId);});
        proposalIndex += 1;
        let updatedProposalsArray = Iter.toArray(proposalsMap.entries());
        return #ok(updatedProposalsArray);
    };

    public shared({caller}) func voteOnProposal(proposalIndex: Nat, adopt: Bool): 
    async Result.Result<(MainTypes.Proposals), MainTypes.Error> {
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v4.treasuryCanisterPrincipal);
        let proposal_ = proposalsMap.get(proposalIndex);
        if(proposal_ == null) return #err(#PorposalHasExpired);
        let ?proposal = proposal_ else { return #err(#PorposalHasExpired) };
        let {votes} = proposal;
        let votesMap = HashMap.fromIter<Text, MainTypes.Vote>( Iter.fromArray(votes), Iter.size(Iter.fromArray(votes)), Text.equal, Text.hash );
        let previousVote = votesMap.get(Principal.toText(caller));
        switch(previousVote){
            case null {
                let neuronsDataArray = await treasuryCanister.getNeuronsDataArray();
                votesMap.put(Principal.toText(caller), {adopt});
                var updatedProposal = {proposal with votes = Iter.toArray(votesMap.entries()); };
                let voteTally = GovernanceHelperMethods.tallyVotes({ neuronsDataArray; proposal = updatedProposal; founder = daoMetaData_v4.founder; userProfilesMap = userProfilesMap_v2; });
                updatedProposal := {updatedProposal with voteTally};
                proposalsMap.put(proposalIndex, updatedProposal);
                return #ok(Iter.toArray(proposalsMap.entries()));
            };
            case (?previousVote_){ return #err(#VoteHasAlreadyBeenSubmitted)};
        };
    };

    private func finalizeProposalVotingPeriod(proposalId: Nat) : async () {
        let ?proposal = proposalsMap.get(proposalId) else return;
        let treasuryCanister: Treasury.Treasury = actor(daoMetaData_v4.treasuryCanisterPrincipal);
        let neuronsDataArray = await treasuryCanister.getNeuronsDataArray();
        let {totalVotingPower} = await treasuryCanister.getDaoTotalStakeAndVotingPower();
        let {yay; nay; total } = GovernanceHelperMethods.tallyVotes({ neuronsDataArray; proposal; founder = daoMetaData_v4.founder; userProfilesMap = userProfilesMap_v2;});
        let participationRate = Float.fromInt(Nat64.toNat(total)) / Float.fromInt(Nat64.toNat(totalVotingPower));
        var executed = false;
        if( yay > nay and participationRate >= quorum) { executed := true; await executeProposal(proposal); };
        let updatedProposal = {proposal with voteTally = {yay; nay; total }; executed;};
        proposalsMap.put(proposalId, updatedProposal);
    };

    private func discardPendingProposals() : () {
        let prunedProposalsArray = Buffer.Buffer<(Nat, MainTypes.Proposal)>(1);
        for((proposalId, proposal) in proposalsMap.entries()){
            let {timeVotingPeriodEnds} = proposal;
            if(timeVotingPeriodEnds < Time.now() ) { prunedProposalsArray.add((proposalId, proposal)); };
        };

        proposalsMap := HashMap.fromIter<Nat, MainTypes.Proposal>(
            Iter.fromArray(Buffer.toArray(prunedProposalsArray)), 
            prunedProposalsArray.size(), 
            Nat.equal, 
            Hash.hash
        );
    };

    private func executeProposal(proposal: MainTypes.Proposal) : async () {
        let treasuryCanister: Treasury.Treasury = actor(daoMetaData_v4.treasuryCanisterPrincipal);
        let {action; proposer;} = proposal;
        switch(action){
            case(#AddAdmin({principal})){
                let updatedDaoMetaData = CanisterManagementMethods.addAdmin(Principal.fromText(principal), daoMetaData_v4);
                daoMetaData_v4 := updatedDaoMetaData;               
            };
            case(#RemoveAdmin({principal})){
                let updatedDaoMetaData = CanisterManagementMethods.removeAdmin(Principal.fromText(principal), daoMetaData_v4);
                daoMetaData_v4 := updatedDaoMetaData;
            };
            //still need to delete the public upgradeApp method once the frontend has been updated
            case(#LoadUpgrades({})){ ignore loadUpgrades_(); };
            case (#InstallUpgrades({})){ ignore installUpgrades_(); };
            case (#CreateNeuron({amount;})){
                ignore await treasuryCanister.createNeuron({amount; contributor = Principal.fromText(proposer);});
            };
            case(#IncreaseNeuron({amount; neuronId;})){
                ignore await treasuryCanister.increaseNeuron({amount; neuronId; contributor = Principal.fromText(proposer);});
            };
            case(#DisburseNeuron({neuronId;})){
                let treasuryAccountId = await treasuryCanister.canisterIcpAccountId(null);
                let neuronsDataArray: TreasuryTypes.NeuronsDataArray = await treasuryCanister.getNeuronsDataArray();
                let neuronsDataMap: TreasuryTypes.NeuronsDataMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronData>(
                    Iter.fromArray(neuronsDataArray), 
                    Iter.size(Iter.fromArray(neuronsDataArray)), 
                    Text.equal, 
                    Text.hash
                );
                let ?neuronData = neuronsDataMap.get(Nat64.toText(neuronId)) else { throw Error.reject("Neuron not found") };
                let ?neuronInfo = neuronData.neuronInfo else { throw Error.reject("Neuron Info not found") };
                let {stake_e8s;} = neuronInfo;
                let args : Governance.ManageNeuron = {
                    id = ?{id = neuronId;};
                    command = ?#Disburse({to_account = ?{hash = treasuryAccountId}; amount = ?{e8s = stake_e8s - txFee} });
                    neuron_id_or_subaccount = null;
                };
                ignore await treasuryCanister.manageNeuron(args, Principal.fromText(proposer));
            };
            case(#DissolveNeuron({neuronId;})){
                let args : Governance.ManageNeuron = {
                    id = ?{id = neuronId;};
                    command = ?#Configure({operation = ?#StartDissolving({});});
                    neuron_id_or_subaccount = null;
                };
                ignore await treasuryCanister.manageNeuron(args, Principal.fromText(proposer));

            };
            case(#FollowNeuron({neuronId; topic; followee;})){
                let followees : [{id: Nat64;}] = [{id = followee;}];
                let args : Governance.ManageNeuron = {
                    id = ?{id = neuronId;};
                    command = ?#Follow({topic; followees;});
                    neuron_id_or_subaccount = null;
                };
                ignore await treasuryCanister.manageNeuron(args, Principal.fromText(proposer));
            };
            case(#IncreaseDissolveDelay({neuronId; additionalDissolveDelaySeconds;})){
                let additional_dissolve_delay_seconds = additionalDissolveDelaySeconds;
                let args : Governance.ManageNeuron = {
                    id = ?{id = neuronId;};
                    command = ?#Configure({operation = ?#IncreaseDissolveDelay({additional_dissolve_delay_seconds});});
                    neuron_id_or_subaccount = null;
                };
                ignore await treasuryCanister.manageNeuron(args, Principal.fromText(proposer));
            };
            case(#SplitNeuron({neuronId; amount;})){
                let args : Governance.ManageNeuron = {
                    id = ?{id = neuronId;};
                    command = ?#Split({amount_e8s = amount;});
                    neuron_id_or_subaccount = null;
                };
                ignore await treasuryCanister.manageNeuron(args, Principal.fromText(proposer));
            };
            case(#SpawnNeuron({neuronId; percentage_to_spawn;})){
                let treasurySelfAuthPrincipal = await treasuryCanister.getSelfAuthenticatingPrincipal();
                let spawnArgs : Governance.Spawn = {
                    percentage_to_spawn : ?Nat32 = ?percentage_to_spawn;
                    new_controller : ?Principal = ?Principal.fromText(treasurySelfAuthPrincipal);
                    nonce : ?Nat64 = ?Nat64.fromNat(0);
                };
                let args : Governance.ManageNeuron = {
                    id = ?{id = neuronId;};
                    command = ?#Spawn(spawnArgs);
                    neuron_id_or_subaccount = null;
                };
                ignore await treasuryCanister.manageNeuron(args, Principal.fromText(proposer));
            };
            case(#PurchaseCycles({amount})){
                //call function to purchase more cycles
            };
            case(#ToggleSupportMode({})){
                let updatedMetaData = await CanisterManagementMethods.toggleSupportMode(daoMetaData_v4);
                daoMetaData_v4 := updatedMetaData;
            };
        };
    };

    system func preupgrade() { 
        discardPendingProposals();
        userProfilesArray_v2 := Iter.toArray(userProfilesMap_v2.entries()); 
        proposalsArray := Iter.toArray(proposalsMap.entries());
    };

    system func postupgrade() { 
        userProfilesArray_v2 := []; 
        proposalsArray := [];
        ignore recurringTimer<system>(#seconds (24 * 60 * 60), heartBeat_unshared);
        ignore recurringTimer<system>(#seconds (60 * 60), heartBeat_hourly);
        ignore recurringTimer<system>(#seconds (30), updateUsersTxHistory);

    };
}