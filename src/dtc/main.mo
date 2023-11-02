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
import Ledger "Ledger/Ledger";
import Account "Ledger/Account";
import JournalTypes "Types/Journal/types";
import MainMethods "Main/MainHelperMethods";
import JournalHelperMethods "Main/JournalHelperMethods";
import MainTypes "Types/Main/types";
import TxHelperMethods "Main/TransactionHelperMethods";
import CanisterManagementMethods "Main/CanisterManagementMethods";
import Manager "Manager/Manager";
import AssetCanister "Types/AssetCanister/types";
import NotificationProtocolMethods "Main/NotificationProtocolMethods";
import NotificationsTypes "Types/Notifications/types";
import IC "IC/ic.types";
import Timer "mo:base/Timer";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Blob "mo:base/Blob";
import GovernanceHelperMethods "Main/GovernanceHelperMethods";
import Treasury "Treasury";
import TreasuryTypes "Types/Treasury/types";
import NnsCyclesMinting "Ledger/NnsCyclesMinting";
import TreasuryHelperMethods "Main/TreasuryHelperMethods";
import AnalyticsHelperMethods "Analytics/AnalyticsHelperMethods";

shared actor class User() = this {

    private stable var daoMetaData_v2 : MainTypes.DaoMetaData_V2 = MainTypes.DEFAULT_DAO_METADATA_V2;

    private stable var userProfilesArray : [(Principal, MainTypes.UserProfile)] = [];

    private stable var proposalIndex: Nat = 0;

    private stable var proposalsArray: MainTypes.Proposals = [];

    private stable var everyFiveSecondsTimerId: {id: Nat; active: Bool} = {id = 0; active = false;};

    private stable var dailyTimerId: {id: Nat; active: Bool;} = {id = 0; active = false;};

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

    private stable var startIndexForBlockChainQuery : Nat64 = 3_512_868;

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
    
    public shared({ caller }) func readJournal () : async Result.Result<(MainTypes.JournalData), JournalTypes.Error> {
        let result = await JournalHelperMethods.readJournal(caller, userProfilesMap);
    };

    public shared({ caller }) func readWalletData() : async Result.Result<({ balance : Ledger.ICP; address: [Nat8]; } ), JournalTypes.Error> {
        let result = await JournalHelperMethods.readWalletData(caller, userProfilesMap);
    };

    public shared({ caller }) func readEntryFileChunk(fileId: Text, chunkId: Nat) : async Result.Result<(Blob),JournalTypes.Error>{
        let result = await JournalHelperMethods.readEntryFileChunk(caller, userProfilesMap, fileId, chunkId);
    };

    public shared({ caller }) func readEntryFileSize(fileId: Text) : async Result.Result<(Nat),JournalTypes.Error>{
        let result = await JournalHelperMethods.readEntryFileSize(caller, userProfilesMap, fileId);
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

    public shared({caller}) func readTransaction() : async Result.Result<[(Nat, JournalTypes.Transaction)], JournalTypes.Error> {
        let result = await TxHelperMethods.readTransaction(caller, userProfilesMap);
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

    public shared({caller}) func toggleAcceptRequest() : async  Result.Result<(MainTypes.DaoMetaData_V2), JournalTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedMetaData = { daoMetaData_v2 with acceptingRequests = not daoMetaData_v2.acceptingRequests; };
        daoMetaData_v2 := updatedMetaData; return #ok(updatedMetaData);
    };

    public shared({caller}) func toggleCyclesSaveMode() : async MainTypes.DaoMetaData_V2{
        let updatedMetaData = { daoMetaData_v2 with cyclesSaveMode = not daoMetaData_v2.cyclesSaveMode; };
        if(updatedMetaData.cyclesSaveMode) deactivateTimers()
        else activateTimers();
        daoMetaData_v2 := updatedMetaData;
        return updatedMetaData;
    };

    private func toggleCyclesSaveMode_() : (){
        let updatedMetaData = { daoMetaData_v2 with cyclesSaveMode = not daoMetaData_v2.cyclesSaveMode; };
        if(updatedMetaData.cyclesSaveMode) deactivateTimers()
        else activateTimers();
        daoMetaData_v2 := updatedMetaData;
    };

    public shared({caller}) func getRequestingPrincipals() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
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

    public shared(msg) func getCanisterCyclesBalances() : async MainTypes.CanisterCyclesBalances{
        let cyclesBalance_backend = Cycles.balance();
        let balances = await CanisterManagementMethods.getCanisterCyclesBalances(cyclesBalance_backend, daoMetaData_v2);
        return balances;
    };

    public shared({caller}) func getCanisterData() : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {
        let cyclesBalance_backend = Cycles.balance();
        let daoMetaDataPackagedForExport = await CanisterManagementMethods.getCanisterData(caller, daoMetaData_v2, cyclesBalance_backend, userProfilesMap, proposalsMap);
        return daoMetaDataPackagedForExport;
    };

    public shared({caller}) func getTreasuryData() : async Result.Result<TreasuryTypes.TreasuryDataExport, MainTypes.Error> {
        let userProfile = userProfilesMap.get(caller);
        if(userProfile == null) return #err(#NotAuthorizedToAccessData);
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
        let contributions = await treasuryCanister.getTreasuryContributionsArray();
        let balance_icp = await treasuryCanister.canisterBalance();
        let accountId_icp_blob = await treasuryCanister.canisterAccount();
        let accountId_icp = Blob.toArray(accountId_icp_blob);
        return #ok({ contributions; balance_icp; accountId_icp; });
    };

    public shared({ caller }) func upgradeApp(): async (){
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ throw Error.reject("Unauthorized Access"); };
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

    public func getCanisterCongtrollers(canisterPrincipal: Principal) : async ([Text]) {
        let canisterStatus = await MainTypes.self.canister_status({ canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let controllersOption = settings.controllers;
        var controllers = Option.get(controllersOption, daoMetaData_v2.defaultControllers);
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
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin){ return #err(#NotAuthorized); };
        let updatedMetaData = await CanisterManagementMethods.toggleSupportMode(caller, daoMetaData_v2);
        daoMetaData_v2 := updatedMetaData;
        return #ok(());
    };

    public shared({ caller }) func getNotifications(): async NotificationsTypes.Notifications{
        let notifications = await NotificationProtocolMethods.notifyOfNewStableRelease(daoMetaData_v2);
        let notifications_ = await NotificationProtocolMethods.appendNotificationsFromJournal(caller, userProfilesMap, notifications);
    };

    public shared({ caller }) func clearJournalNotifications(): async (){
        await NotificationProtocolMethods.clearJournalNotifications(caller, userProfilesMap);
    };

    public shared({ caller }) func depositToTreasury({ amount: Nat64; currency: TreasuryTypes.SupportedCurrencies; }):
    async Result.Result<Ledger.ICP, MainTypes.Error>{
        let isAdmin = CanisterManagementMethods.getIsAdmin(caller, daoMetaData_v2);
        if(not isAdmin) return #err(#NotAuthorized);
        let updatedBalance = await TreasuryHelperMethods.depositAssetToTreasury({
            depositorPrincipal = Principal.toText(caller);
            treasuryCanisterPrincipal = daoMetaData_v2.treasuryCanisterPrincipal;
            amount;
            currency;
            profilesMap = userProfilesMap;
        });
        return updatedBalance;
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

    let {recurringTimer; cancelTimer; setTimer} = Timer;

    public shared({caller}) func createProposal({action: MainTypes.ProposalActions; payload: MainTypes.ProposalPayload }): 
    async Result.Result<(MainTypes.Proposals),MainTypes.Error>{
        let callerProfile = userProfilesMap.get(caller);
        if(callerProfile == null) return #err(#NotAuthorizedToCreateProposals);
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
        let treasuryContributionRequired = GovernanceHelperMethods.getDoesProposalRequireTreasuryContribution(action);
        let hasSufficientContributions = await treasuryCanister.userHasSufficientContributions(caller);
        if(not hasSufficientContributions and treasuryContributionRequired) return #err(#NotAuthorizedToCreateProposals);
        let treasuryContributionsArray = await treasuryCanister.getTreasuryContributionsArray();
        let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
        let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
        let {xdr_permyriad_per_icp} = data;
        let proposer = Principal.toText(caller); let votes = [(proposer, {adopt = true})];
        let timeInitiated = Time.now(); let timeExecuted = null;
        var voteTally = {yay = Float.fromInt(0); nay = Float.fromInt(0); total = Float.fromInt(0);};
        let proposal = {votes; action; proposer; timeInitiated; timeExecuted; payload; voteTally;};
        let votingResults = GovernanceHelperMethods.tallyVotes({treasuryContributionsArray; proposal; xdr_permyriad_per_icp;});
        proposalsMap.put(proposalIndex, {proposal with voteTally = votingResults} );
        let timerId = setTimer(#seconds(24 * 60 * 60 * 3), finalizeProposalVotingPeriod);
        proposalIndex += 1;
        let updatedProposalsArray = Iter.toArray(proposalsMap.entries());
        return #ok(updatedProposalsArray);
    };

    public shared({caller}) func voteOnProposal({proposalIndex: Nat; adopt: Bool;}): 
    async Result.Result<(MainTypes.Proposal), MainTypes.Error> {
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData_v2.treasuryCanisterPrincipal);
        let hasSufficientContributions = await treasuryCanister.userHasSufficientContributions(caller);
        if(not hasSufficientContributions) return #err(#NotAuthorizedToVoteOnThisProposal);
        let proposal_ = proposalsMap.get(proposalIndex);
        if(proposal_ == null) return #err(#PorposalHasExpired);
        let ?proposal = proposal_;
        let {votes} = proposal;
        let votesMap = HashMap.fromIter<Text, MainTypes.Vote>( Iter.fromArray(votes), Iter.size(Iter.fromArray(votes)), Text.equal, Text.hash );
        let previousVote = votesMap.get(Principal.toText(caller));
        switch(previousVote){
            case null {
                let treasuryContributionsArray = await treasuryCanister.getTreasuryContributionsArray();
                votesMap.put(Principal.toText(caller), {adopt});
                var updatedProposal = {proposal with votes = Iter.toArray(votesMap.entries()); };
                let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
                let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
                let {xdr_permyriad_per_icp} = data;
                let voteTally = GovernanceHelperMethods.tallyVotes({treasuryContributionsArray; proposal = updatedProposal; xdr_permyriad_per_icp});
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
                let treasuryContributionsArray = await treasuryCanister.getTreasuryContributionsArray();
                let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
                let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
                let {xdr_permyriad_per_icp} = data;
                let votingResults = GovernanceHelperMethods.tallyVotes({treasuryContributionsArray; proposal; xdr_permyriad_per_icp});
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
            case (#DepositIcpToTreasury){
                switch(amount){
                    case null {};
                    case(?amount_){
                        let newBalance = await TreasuryHelperMethods.depositAssetToTreasury({
                            depositorPrincipal = proposer;
                            treasuryCanisterPrincipal = daoMetaData_v2.treasuryCanisterPrincipal;
                            amount = amount_;
                            currency = #Icp;
                            profilesMap = userProfilesMap;
                        })
                    }
                }
            };
            case (#DepositIcpToNeuron){
                //call function to deposit ICP to treasury's neuron from user's wallet
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
            //still need to delete the public toggleCyclesSaveMode method once the frontend has been updated
            case(#ToggleCyclesSaverMode){ toggleCyclesSaveMode_(); };
            case(#PurchaseCycles){
                //call function to purchase more cycles
            };
        };
    };

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
    
    system func preupgrade() { 
        userProfilesArray := Iter.toArray(userProfilesMap.entries()); 
        proposalsArray := Iter.toArray(proposalsMap.entries());
    };

    system func postupgrade() { userProfilesArray:= []; proposalsArray := []};
}