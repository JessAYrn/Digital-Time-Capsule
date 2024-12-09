import Account "../../Serializers/Account";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import JournalTypes "../Journal/types";
import TreasuryTypes "../Treasury/types";
import IC "../IC/types";
import Ledger "../../NNS/Ledger";


module{

    public let self : IC.Self = actor "aaaaa-aa";

    public let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public let heartBeatInterval : Nat64 = 100;

    public let heartBeatInterval_refill : Nat64 = 25000;

    public let oneICP : Nat64 = 100_000_000;

    public let nanosecondsInADay = 86400000000000;

    public let daysInAMonth = 30;

    public type PrincipalAsText = Text;

    public type JournalData = {
        userJournalData : ([JournalTypes.JournalEntryExportKeyValuePair], JournalTypes.Bio,); 
        userName: Text;
        rootCanisterPrincipal: Text;
        userPrincipal: Text;
        cyclesBalance: Nat;
    };

    public type Error = {
        #NotAuthorizedToCreateProposals;
        #NotAuthorizedToVoteOnThisProposal;
        #VoteHasAlreadyBeenSubmitted;
        #NotAuthorized;
        #ProposalNotFound;
        #PorposalHasExpired;
        #NotAuthorizedToAccessData;
        #NoProfileFound;
        #InsufficientFunds;
    };

    public type UserProfile_V2 = {
        canisterId : Principal;
        email: ? Text;
        userName : Text;
        userPrincipal: Principal;
        accountId: ?Account.AccountIdentifier;
        approved: ?Bool;
    };

    public type ProfileInput = {
        userName: ?Text;
        email: ?Text;
    };

    public type AmountAccepted = {
        accepted: Nat64
    };
    

    public type ProfileMetaData = {userPrincipal : Text; canisterId : Text; approvalStatus: Bool; userName: Text;};

    public type ProfilesMetaData = [ProfileMetaData];

    public type AdminData = {percentage : Nat};

    public type CanisterDataExport = {
        journalCount: Nat;
        treasuryCanisterPrincipal: Text;
        managerCanisterPrincipal: Text;
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        admin: [(Text, AdminData)];
        proposals: Proposals_V2;
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        profilesMetaData: ProfilesMetaData;
        isAdmin: Bool;
        founder: Text;
        supportMode: Bool;
        releaseVersionLoaded: Nat;
        releaseVersionInstalled: Nat;
        requestsForAccess: RequestsForAccess;
        costToEnterDao: Nat64;
        daoIsPrivate: Bool
    };

    public type DaoMetaData_V4 = {
        managerCanisterPrincipal: Text; 
        treasuryCanisterPrincipal: Text;
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        admin: [(Text, AdminData)];
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        founder: Text;
        supportMode: Bool;
    };

    public type RequestForAccess = {approved: Bool; escrowSubaccountId: Account.Subaccount };

    public type RequestsForAccess = [(Text, {approved: Bool; escrowSubaccountId: Account.Subaccount })];

    public type RequestsForAccessMap = HashMap.HashMap<Text, RequestForAccess>;

    public type CanisterCyclesBalances = {
        currentCyclesBalance_backend: Nat;
        currentCyclesBalance_frontend: Nat;
        currentCyclesBalance_manager: Nat;
        currentCyclesBalance_treasury: Nat;
    };


    public type UserProfilesMap_V2 = HashMap.HashMap<Principal, UserProfile_V2>;

    public type UserProfilesArray_V2 = [(Principal, UserProfile_V2)];

    public type Proposals_V2 = [(Nat,Proposal_V2)];

    public type ProposalsMap_V2 = HashMap.HashMap<Nat, Proposal_V2>;

    public type SubnetType = {#Fiduciary; #Application};

    public type VotingResults_V2 = {
        yay: Nat64;
        nay: Nat64;
        totalParticipated: Nat64;
    };

    public type Proposal_V2 = {
        votes: [(Text, Vote)];
        voteTally: VotingResults_V2;
        action: ProposalActions_V2;
        proposer: Text;
        timeInitiated: Int;
        executed: Bool;
        finalized: Bool;
        timeVotingPeriodEnds: Int;
    };

    public type ProposalActions_V2 = {
        #AddAdmin: {principal: Text};
        #RemoveAdmin: {principal: Text};
        #InstallUpgrades: {};
        #CreateNeuron: {amount: Nat64; };
        #CreateFundingCampaign: {fundingCampaignInput: TreasuryTypes.FundingCampaignInput};
        #CancelFundingCampaign: {fundingCampaignId: Nat};
        #IncreaseNeuron: {amount: Nat64; neuronId: Nat64; onBehalfOf: ?PrincipalAsText};
        #PurchaseCycles: {amount : Nat64;};
        #SpawnNeuron: {neuronId: Nat64; percentage_to_spawn : Nat32;};
        #DisburseNeuron: {neuronId: Nat64; };
        #DissolveNeuron: {neuronId: Nat64; };
        #IncreaseDissolveDelay: {neuronId: Nat64; additionalDissolveDelaySeconds: Nat32; };
        #FollowNeuron: {neuronId: Nat64; topic : Int32; followee :  Nat64 };
        #ToggleSupportMode: {};
        #WithdrawFromMultiSigWallet: {amount: Nat64; to: PrincipalAsText;};
        #SetCostToEnterDao: {amount: Nat64};
        #TogglePrivacySetting: {};
    };

    public type Vote = { adopt: Bool };

    public let DEFAULT_DAO_METADATA_V4: DaoMetaData_V4 = {
        managerCanisterPrincipal = "Null";
        treasuryCanisterPrincipal = "Null";
        frontEndPrincipal = "Null";
        backEndPrincipal = "Null";
        lastRecordedBackEndCyclesBalance = 0;
        backEndCyclesBurnRatePerDay = 0;
        admin = [];
        acceptingRequests = true;
        lastRecordedTime = 0;
        supportMode = false;
        founder = "Null";
    };

    public type Interface = actor {
        scheduleCanistersToBeUpdatedExceptBackend: () -> async ();
    };

}