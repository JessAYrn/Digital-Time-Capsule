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
import Option "mo:base/Option";
import Ledger "NNS/Ledger";
import Account "HashersAndSerializers/Account";
import JournalTypes "Types/Journal/types";
import MainMethods "Modules/Main/MainHelperMethods";
import JournalHelperMethods "Modules/Main/JournalHelperMethods";
import MainTypes "Types/Main/types";
import TxHelperMethods "Modules/Main/TransactionHelperMethods";
import CanisterManagementMethods "Modules/Main/CanisterManagementMethods";
import Manager "Manager";
import AssetCanister "Types/AssetCanister/types";
import NotificationProtocolMethods "Modules/Main/NotificationProtocolMethods";
import NotificationsTypes "Types/Notifications/types";
import IC "Types/IC/types";
import Timer "mo:base/Timer";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Blob "mo:base/Blob";
import Order "mo:base/Order";
import Array "mo:base/Array";
import GovernanceHelperMethods "Modules/Main/GovernanceHelperMethods";
import Treasury "Treasury";
import TreasuryTypes "Types/Treasury/types";
import NnsCyclesMinting "NNS/NnsCyclesMinting";
import TreasuryHelperMethods "Modules/Main/TreasuryHelperMethods";
import AnalyticsHelperMethods "Modules/Analytics/AnalyticsHelperMethods";
import AnalyticsTypes "Types/Analytics/types";
import Journal "Journal";
import WasmStore "Types/WasmStore/types";
import SupportCanisterIds "SupportCanisterIds/SupportCanisterIds";
import MarketData "Modules/HTTPRequests/MarketData";
import RepresentationIndependentHash "HashersAndSerializers/RepresentationIndependentHash";
import Hex "HashersAndSerializers/Hex";

shared actor class User() = this {

    private stable var daoMetaData_v2 : MainTypes.DaoMetaData_V2 = MainTypes.DEFAULT_DAO_METADATA_V2;

    private stable var userProfilesArray : [(Principal, MainTypes.UserProfile)] = [];

    private stable var proposalIndex: Nat = 0;

    private stable var proposalsArray: MainTypes.Proposals = [];

    private stable var xdr_permyriad_per_icp: Nat64 = 1;

    private stable var frontEndCanisterBalance: Nat = 1;

    private var userProfilesMap : MainTypes.UserProfilesMap = HashMap.fromIter<Principal, MainTypes.UserProfile>(
        Iter.fromArray(userProfilesArray), 
        Iter.size(Iter.fromArray(userProfilesArray)), 
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

    private let ic : IC.Self = actor "aaaaa-aa";

    public query({caller}) func hasAccount() : async Bool {
        let userProfile = userProfilesMap.get(caller);
        switch(userProfile){ case null { return false}; case(?profile){ return true;}};
    };
    
    public shared({ caller }) func create () : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {
        let amountAccepted = await MainMethods.create(caller, userProfilesMap, daoMetaData_v2);
        let updatedDaoMetaData = await CanisterManagementMethods.removeFromRequestsList([Principal.toText(caller)], daoMetaData_v2);
        switch(amountAccepted){
            case(#ok(amount)){ daoMetaData_v2 := updatedDaoMetaData; return #ok(amount); };
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
        switch(result){ case(#ok(_)){ #ok(()); }; case(#err(e)){ #err(e); }; };
    };
    
    public composite query({ caller }) func readJournal () : async Result.Result<(MainTypes.JournalData), JournalTypes.Error> {
        let result = userProfilesMap.get(caller);
        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId)); 
                let (entriesArray, bio, canisterPrincipal) = await journal.readJournal();
                return #ok({ userJournalData = (entriesArray, bio); email = v.email; userName = v.userName; principal = canisterPrincipal; });
            };
        };   
    };

    public composite query({ caller }) func readWalletData() : async Result.Result<({ balance : Ledger.ICP; address: [Nat8]; } ), JournalTypes.Error> {
        let result = userProfilesMap.get(caller);
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
        let result = userProfilesMap.get(caller);
        switch(result){
            case null{ #err(#NotFound); };
            case ( ? existingProfile){
                let journal: Journal.Journal = actor(Principal.toText(existingProfile.canisterId));
                let entryFile = await journal.readJournalFileChunk(fileId, chunkId);
            };
        };
    };

    public composite query({ caller }) func readEntryFileSize(fileId: Text) : async Result.Result<(Nat),JournalTypes.Error>{
        let result = userProfilesMap.get(caller);
        switch(result){
            case null{ #err(#NotFound); };
            case ( ? existingProfile){
                let journal: Journal.Journal = actor(Principal.toText(existingProfile.canisterId));
                let entryFileSize = await journal.readJournalFileSize(fileId);
            };
        };
    };

    public shared({ caller }) func updateBio(bio: JournalTypes.Bio) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let result = await JournalHelperMethods.updateBio(caller, userProfilesMap, bio);
    };

    public shared({caller}) func updatePhotos(photos: [JournalTypes.FileMetaData]): async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let result = await JournalHelperMethods.updatePhotos(caller, userProfilesMap, photos);
    };

    public shared({caller}) func createJournalEntry(): async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        let result = await JournalHelperMethods.createJournalEntry(caller, userProfilesMap);
    };

    public shared({ caller }) func markJournalEntryAsRead(entryKey: JournalTypes.EntryKey) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.markJournalEntryAsRead(caller, userProfilesMap, entryKey);
    };

    public shared({caller}) func updateJournalEntry(entryKey : JournalTypes.EntryKey, entry : JournalTypes.JournalEntry) : 
    async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        let result = await JournalHelperMethods.updateJournalEntry(caller, userProfilesMap, entry, entryKey);
    };

    public shared({ caller }) func submitJournalEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<[JournalTypes.JournalEntryExportKeyValuePair], JournalTypes.Error> {
        let result = await JournalHelperMethods.submitJournalEntry(caller, userProfilesMap, entryKey);
    };

    public shared({ caller }) func deleteJournalEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.deleteJournalEntry(caller, userProfilesMap, entryKey);
    };

    public shared({caller}) func deleteFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let result = await JournalHelperMethods.deleteFile(caller, userProfilesMap, fileId);
    };

    public shared({caller}) func uploadJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk: Blob): async Result.Result<(Text), JournalTypes.Error>{
        let result = await JournalHelperMethods.uploadJournalEntryFile(caller, userProfilesMap, fileId, chunkId, blobChunk);
    };
    
    public shared({caller}) func transferICP(amount: Nat64, canisterAccountId: Account.AccountIdentifier) : async Result.Result<(), JournalTypes.Error> {
        let result = await TxHelperMethods.transferICP(caller, userProfilesMap, amount, canisterAccountId);
    };

    public composite query({caller}) func readTransaction() : async Result.Result<[(Nat, JournalTypes.Transaction)], JournalTypes.Error> {
        let result = userProfilesMap.get(caller);
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
            let newStartIndexForNextQuery = await TxHelperMethods.updateUsersTxHistory(userProfilesMap, startIndexForBlockChainQuery, daoMetaData_v2);
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
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedDaoMetaData = await CanisterManagementMethods.grantAccess(principals, daoMetaData_v2);
        switch(updatedDaoMetaData){
            case(#ok(metaData)){ daoMetaData_v2 := metaData; return #ok(metaData.requestsForAccess); };
            case(#err(e)){ return #err(e); };
        };
    };

    public shared({caller}) func updateApprovalStatus(principals: [Text], newApprovalStatus: Bool) : 
    async Result.Result<(MainTypes.ProfilesMetaData), JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ return #err(#NotAuthorized); };
        CanisterManagementMethods.updateApprovalStatus(principals, userProfilesMap, newApprovalStatus);
        let profilesApprovalStatuses = CanisterManagementMethods.getProfilesMetaData(userProfilesMap);
        return #ok(profilesApprovalStatuses);
    };

    public shared({caller}) func removeFromRequestsList(principals: [Text]) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedDaoMetaDataList = await CanisterManagementMethods.removeFromRequestsList(principals, daoMetaData_v2);
        daoMetaData_v2 := updatedDaoMetaDataList;
        return #ok(updatedDaoMetaDataList.requestsForAccess);
    };

    public shared({caller}) func configureApp(frontEndPrincipal : Text, adminPrincipal: Text ) : async Result.Result<(), JournalTypes.Error> {
        let canConfigureApp = CanisterManagementMethods.canConfigureApp(daoMetaData_v2);
        if(not canConfigureApp){ return #err(#NotAuthorized); };
        let backEndPrincipal = Principal.toText(Principal.fromActor(this));
        let updatedMetaData = await CanisterManagementMethods.configureApp( backEndPrincipal, frontEndPrincipal, adminPrincipal, daoMetaData_v2);
        daoMetaData_v2 := updatedMetaData;
        #ok(());
    };

    public query func transform({context: Blob; response: IC.http_response}) : async IC.http_response {
      let transformed : IC.http_response = {
        status = response.status;
        body = response.body;
        headers = [];
      };
      transformed;
    };

    public shared func getCurrencyExchangeRate(unitCurrency: Text, otherCurrency: Text) : async IC.http_response_with_text {
        let {status; body; headers; } = await MarketData.getCurrencyExchangeRate(unitCurrency, otherCurrency, transform);
        return {status; headers; body = Text.decodeUtf8(body)};
    };

    public shared({caller}) func toggleAcceptRequest() : async  Result.Result<(MainTypes.DaoMetaData_V2), JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedMetaData = { daoMetaData_v2 with acceptingRequests = not daoMetaData_v2.acceptingRequests; };
        daoMetaData_v2 := updatedMetaData; return #ok(updatedMetaData);
    };

    public query({caller}) func getRequestingPrincipals() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ return #err(#NotAuthorized); }
        else { return #ok(daoMetaData_v2.requestsForAccess) };
    };

    public shared({caller}) func requestApproval() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        let result = CanisterManagementMethods.requestApproval(caller, daoMetaData_v2);
        switch(result){
            case (#err(e)){ return #err(e)};
            case (#ok(updatedDaoMetaData)){ 
                daoMetaData_v2 := updatedDaoMetaData;
                return #ok(updatedDaoMetaData.requestsForAccess)
            };
        };
    };

    public composite query(msg) func getCanisterCyclesBalances() : async MainTypes.CanisterCyclesBalances{
        let currentCyclesBalance_backend = Cycles.balance();
        let managerCanister: Manager.Manager = actor(daoMetaData_v2.managerCanisterPrincipal);
        let treasuryCanister: Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
        let currentCyclesBalance_frontend  = frontEndCanisterBalance;
        let currentCyclesBalance_treasury = await treasuryCanister.getCyclesBalance();
        let currentCyclesBalance_manager = await managerCanister.getCyclesBalance();
        return {currentCyclesBalance_backend; currentCyclesBalance_frontend; currentCyclesBalance_manager; currentCyclesBalance_treasury};
    };

    public composite query({caller}) func getCanisterData() : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {
        let profile = userProfilesMap.get(caller);
        switch(profile){
            case null{ return #err(#NotAuthorized); };
            case (? existingProfile){
                let managerCanister : Manager.Manager = actor(daoMetaData_v2.managerCanisterPrincipal);
                let treasuryCanister: Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
                let treasuryUsersStakesArray = await treasuryCanister.getTreasuryUsersStakesArray();
                let profilesMetaData = CanisterManagementMethods.getProfilesMetaData(userProfilesMap);
                let {number = releaseVersion} = await managerCanister.getCurrentReleaseVersion();
                let canisterDataPackagedForExport = {
                    daoMetaData_v2 with 
                    proposals = GovernanceHelperMethods.tallyAllProposalVotes({proposals = proposalsMap; treasuryUsersStakesArray;});
                    isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
                    currentCyclesBalance_backend = Cycles.balance();
                    journalCount = userProfilesMap.size();
                    profilesMetaData;
                    releaseVersion;
                };
                return #ok(canisterDataPackagedForExport);
            };
        };
    };

    public composite query({caller}) func getTreasuryData() : async Result.Result<TreasuryTypes.TreasuryDataExport, MainTypes.Error> {
        let userProfile = userProfilesMap.get(caller);
        if(userProfile == null) return #err(#NotAuthorizedToAccessData);
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
        let collateral = await treasuryCanister.getTreasuryCollateralArray();
        let balance_icp = await treasuryCanister.canisterBalance();
        let accountId_icp_blob = await treasuryCanister.canisterAccountId();
        let accountId_icp = Blob.toArray(accountId_icp_blob);
        return #ok({ collateral; balance_icp; accountId_icp; });
    };

    public shared({ caller }) func upgradeApp(): async (){
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin and not (Principal.toText(caller) == SupportCanisterIds.TechSupportPrincipal2 and daoMetaData_v2.supportMode)){ 
            throw Error.reject("Unauthorized Access"); 
        };
        let managerCanister: Manager.Manager = actor(daoMetaData_v2.managerCanisterPrincipal);
        await managerCanister.loadRelease();
        try { await updateCanistersExceptBackend(); } 
        catch (e) {
            await managerCanister.loadPreviousRelease();  
            await updateCanistersExceptBackend();
            throw Error.reject("Upgrade Failed, no code changes have been implemented.")
        };
        ignore managerCanister.scheduleBackendCanisterToBeUpdated();
    };

    private func upgradeApp_(): async (){
        let managerCanister: Manager.Manager = actor(daoMetaData_v2.managerCanisterPrincipal);
        await managerCanister.loadRelease();
        try { await updateCanistersExceptBackend(); } 
        catch (e) {
            await managerCanister.loadPreviousRelease();  
            await updateCanistersExceptBackend();
            throw Error.reject("Upgrade Failed, no code changes have been implemented.")
        };
        ignore managerCanister.scheduleBackendCanisterToBeUpdated();
    };

    private func updateCanistersExceptBackend(): async (){
        let managerCanister: Manager.Manager = actor(daoMetaData_v2.managerCanisterPrincipal);
        await CanisterManagementMethods.installCode_managerCanister(daoMetaData_v2);
        let result_0 = await managerCanister.installCode_frontendCanister(daoMetaData_v2);
        let result_1 = await managerCanister.installCode_journalCanisters(Iter.toArray(userProfilesMap.entries()));
        let result_2 = await managerCanister.installCode_treasuryCanister(daoMetaData_v2);
    };

    public shared({caller}) func scheduleCanistersToBeUpdatedExceptBackend(): async () {
        if( Principal.toText(caller) != daoMetaData_v2.managerCanisterPrincipal) { throw Error.reject("Unauthorized access."); };
        let {setTimer} = Timer;
        let timerId = setTimer(#nanoseconds(1), updateCanistersExceptBackend);
    };

    public shared({caller}) func toggleSupportMode() : async Result.Result<(),JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedMetaData = await CanisterManagementMethods.toggleSupportMode(caller, daoMetaData_v2);
        daoMetaData_v2 := updatedMetaData;
        return #ok(());
    };

    public composite query({ caller }) func getNotifications(): async NotificationsTypes.Notifications{
        let userProfile = userProfilesMap.get(caller);
        switch(userProfile){
            case null {throw Error.reject("user profile not found")};
            case(?profile){
                let managerCanister : Manager.Manager = actor(daoMetaData_v2.managerCanisterPrincipal);
                let userCanister: Journal.Journal = actor(Principal.toText(profile.canisterId));
                let userNotifications = await userCanister.getNotifications();
                let notificationsBuffer = Buffer.fromArray<NotificationsTypes.Notification>(userNotifications);
                let currentReleaseVersion = await managerCanister.getCurrentReleaseVersion();
                let nextStableVersion = await managerCanister.getWhatIsNextStableReleaseVersion();
                let text = Text.concat("New Stable Version Availabe: Version #", Nat.toText(nextStableVersion.number));
                if(nextStableVersion.number > currentReleaseVersion.number) notificationsBuffer.add({text; key = null});
                return notificationsBuffer.toArray();
            };
        };
    };

    public shared({ caller }) func clearJournalNotifications(): async (){
        await NotificationProtocolMethods.clearJournalNotifications(caller, userProfilesMap);
    };

    public shared({ caller }) func depositCollateral(amount: Nat64, currency: TreasuryTypes.SupportedCurrencies):
    async Result.Result<Ledger.ICP, MainTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin) return #err(#NotAuthorized);
        let updatedBalance = await TreasuryHelperMethods.depositCollateral({
            depositorPrincipal = Principal.toText(caller);
            treasuryCanisterPrincipal = daoMetaData_v2.treasuryCanisterPrincipal;
            amount;
            currency;
            profilesMap = userProfilesMap;
        });
        return updatedBalance;
    };
    
    public composite query({ caller }) func retrieveUserBalances(): async AnalyticsTypes.BalancesArray {
        let userProfile = userProfilesMap.get(caller);
        switch(userProfile){
            case null { throw Error.reject("No profile found for this principal")};
            case(?profile) {
                let userCanister : Journal.Journal = actor(Principal.toText(profile.canisterId));
                let balancesHistory = await userCanister.readBalancesHistory();
            };
        };
    };

    public composite query({ caller }) func retrieveTreasuryBalances() : async AnalyticsTypes.BalancesArray {
        let userProfile = userProfilesMap.get(caller);
        switch(userProfile){
            case null { throw Error.reject("No profile found for this principal")};
            case(?_){
                let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
                let balancesHistory = await treasuryCanister.readBalancesHistory();
            };
        };
    };

    public shared({caller}) func heartBeat(): async (){
        let cyclesBalance_backend = Cycles.balance();
        ignore NotificationProtocolMethods.updateUserCanisterNotifications(userProfilesMap);
        let updatedMetaData = await CanisterManagementMethods.heartBeat(cyclesBalance_backend, daoMetaData_v2, userProfilesMap);
        daoMetaData_v2 := updatedMetaData;
    };  

    private func heartBeat_unshared(): async () {
        let cyclesBalance_backend = Cycles.balance();
        ignore NotificationProtocolMethods.updateUserCanisterNotifications(userProfilesMap);
        ignore AnalyticsHelperMethods.saveCurrentBalances(userProfilesMap, daoMetaData_v2);
        let updatedMetaData = await CanisterManagementMethods.heartBeat(cyclesBalance_backend, daoMetaData_v2, userProfilesMap);
        daoMetaData_v2 := updatedMetaData;
    };

    private func heartBeat_hourly(): async () {
        let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
        let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
        let {xdr_permyriad_per_icp = xdr_permyriad_per_icp_} = data;
        let {cycles} = await ic.canister_status({ canister_id = Principal.fromText(daoMetaData_v2.frontEndPrincipal) });
        frontEndCanisterBalance := cycles;
        xdr_permyriad_per_icp := xdr_permyriad_per_icp_;
    };

    let {recurringTimer; cancelTimer; setTimer} = Timer;

    public shared({caller}) func createProposal(action: MainTypes.ProposalActions, payload: MainTypes.ProposalPayload): 
    async Result.Result<(MainTypes.Proposals),MainTypes.Error>{
        let callerProfile = userProfilesMap.get(caller);
        if(callerProfile == null) return #err(#NotAuthorizedToCreateProposals);
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
        let hasSufficientStake = await treasuryCanister.userHasSufficientStake(caller);
        if(not hasSufficientStake) return #err(#NotAuthorizedToCreateProposals);
        let treasuryUsersStakesArray = await treasuryCanister.getTreasuryUsersStakesArray();
        let proposer = Principal.toText(caller); let votes = [(proposer, {adopt = true})];
        let timeInitiated = Time.now(); let timeExecuted = null;
        var voteTally = {yay = Nat64.fromNat(0); nay = Nat64.fromNat(0); total = Nat64.fromNat(0);};
        let proposal = {votes; action; proposer; timeInitiated; timeExecuted; payload; voteTally;};
        let votingResults = GovernanceHelperMethods.tallyVotes({treasuryUsersStakesArray; proposal;});
        proposalsMap.put(proposalIndex, {proposal with voteTally = votingResults} );
        let timerId = setTimer(#seconds(24 * 60 * 60 * 3), finalizeProposalVotingPeriod);
        proposalIndex += 1;
        let updatedProposalsArray = Iter.toArray(proposalsMap.entries());
        return #ok(updatedProposalsArray);
    };

    public shared({caller}) func voteOnProposal(proposalIndex: Nat, adopt: Bool): 
    async Result.Result<(MainTypes.Proposal), MainTypes.Error> {
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
        let hasSufficientStake = await treasuryCanister.userHasSufficientStake(caller);
        if(not hasSufficientStake) return #err(#NotAuthorizedToVoteOnThisProposal);
        let proposal_ = proposalsMap.get(proposalIndex);
        if(proposal_ == null) return #err(#PorposalHasExpired);
        let ?proposal = proposal_;
        let {votes} = proposal;
        let votesMap = HashMap.fromIter<Text, MainTypes.Vote>( Iter.fromArray(votes), Iter.size(Iter.fromArray(votes)), Text.equal, Text.hash );
        let previousVote = votesMap.get(Principal.toText(caller));
        switch(previousVote){
            case null {
                let treasuryUsersStakesArray = await treasuryCanister.getTreasuryUsersStakesArray();
                votesMap.put(Principal.toText(caller), {adopt});
                var updatedProposal = {proposal with votes = Iter.toArray(votesMap.entries()); };
                let voteTally = GovernanceHelperMethods.tallyVotes({treasuryUsersStakesArray; proposal = updatedProposal});
                updatedProposal := {updatedProposal with voteTally};
                proposalsMap.put(proposalIndex, updatedProposal);
                return #ok(updatedProposal);
            };
            case (?previousVote_){ return #err(#VoteHasAlreadyBeenSubmitted)};
        };
    };


    private func finalizeProposalVotingPeriod() : async () {
        let proposalsIter = proposalsMap.entries();
        var oldestPendingProposalId = proposalIndex;
        Iter.iterate<(Nat, MainTypes.Proposal)>(proposalsIter, func(x : (Nat, MainTypes.Proposal), index : Nat){
            let (proposalId, proposal) = x;
            if(proposalId < oldestPendingProposalId) oldestPendingProposalId := proposalId;
        });
        let proposalOptional = proposalsMap.get(oldestPendingProposalId);
        switch(proposalOptional){
            case null {};
            case (?proposal){
                let treasuryCanister: Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
                let treasuryUsersStakesArray = await treasuryCanister.getTreasuryUsersStakesArray();
                let votingResults = GovernanceHelperMethods.tallyVotes({treasuryUsersStakesArray; proposal;});
                let {yay; nay; total } = votingResults;
                var timeExecuted: ?Int = null;
                if( yay > nay) {
                    ignore executeProposal(proposal);
                    timeExecuted := ?Time.now();
                };
                // let updatedProposal = {proposal with voteTally = votingResults; timeExecuted;};
                proposalsMap.delete(oldestPendingProposalId);
            };
        };
    };

    private func executeProposal(proposal: MainTypes.Proposal) : async () {
        let {action; payload; proposer;} = proposal;
        let {amount; principal} = payload;
        switch(action){
            case(#AddAdmin){
                switch(payload.principal){
                    case null { return };
                    case(? principal){
                        let updatedDaoMetaData = CanisterManagementMethods.addAdmin(Principal.fromText(principal), daoMetaData_v2);
                        daoMetaData_v2 := updatedDaoMetaData;
                    };
                };            };
            case(#RemoveAdmin){
                switch(payload.principal){
                    case null { return };
                    case(? principal){
                        let updatedDaoMetaData = CanisterManagementMethods.removeAdmin(Principal.fromText(principal), daoMetaData_v2);
                        daoMetaData_v2 := updatedDaoMetaData;
                    };
                };
            };
            //still need to delete the public upgradeApp method once the frontend has been updated
            case (#UpgradeApp){ ignore upgradeApp_(); };
            case(#DissolveIcpNeuron){
                //call function to dissolve the Treasuries Neuron
            };
            case(#FollowIcpNeuron){
                //call function to follow ICP neuron
            };
            case(#SpawnIcpNeuron){
                //call function to spawn ICP neuron
            };
            case(#DispurseIcpNeuron){
                //call function to dispurse ICP neuron
            };
            case(#PurchaseCycles){
                //call function to purchase more cycles
            };
        };
    };

    let timerId_daily = recurringTimer(#seconds (24 * 60 * 60), heartBeat_unshared);
    let timerId_hourly = recurringTimer(#seconds (60 * 60), heartBeat_hourly);
    let timerId_everyThirtySeconds = recurringTimer(#seconds (30), updateUsersTxHistory);

    system func preupgrade() { 
        userProfilesArray := Iter.toArray(userProfilesMap.entries()); 
        proposalsArray := Iter.toArray(proposalsMap.entries());
    };

    system func postupgrade() { 
        userProfilesArray:= []; 
        proposalsArray := [];
    };
}