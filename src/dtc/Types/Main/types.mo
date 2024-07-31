import Account "../../Serializers/Account";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import JournalTypes "../Journal/types";
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
        #PorposalHasExpired;
        #NotAuthorizedToAccessData;
        #NoProfileFound;
        #InsufficientFunds;
        #InstallUpgradeProposalIsActive
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
        proposals: Proposals;
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        profilesMetaData: ProfilesMetaData;
        isAdmin: Bool;
        nftId: ?Nat;
        founder: Text;
        supportMode: Bool;
        releaseVersionLoaded: Nat;
        releaseVersionInstalled: Nat;
        requestsForAccess: RequestsForAccess;
    };

    public type DaoMetaData_V3 = {
        managerCanisterPrincipal: Text; 
        treasuryCanisterPrincipal: Text;
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        admin: [(Text, AdminData)];
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        nftId: ?Nat;
        founder: ?Text;
        supportMode: Bool;
        requestsForAccess: RequestsForAccess;
        defaultControllers: [Principal];
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
        nftId: ?Nat;
        founder: Text;
        supportMode: Bool;
        requestsForAccess: RequestsForAccess;
        defaultControllers: [Principal];
    };

    public type Approved = Bool;

    public type RequestsForAccess = [(Text, Approved)];

    public type CanisterCyclesBalances = {
        currentCyclesBalance_backend: Nat;
        currentCyclesBalance_frontend: Nat;
        currentCyclesBalance_manager: Nat;
        currentCyclesBalance_treasury: Nat;
    };


    public type UserProfilesMap_V2 = HashMap.HashMap<Principal, UserProfile_V2>;

    public type UserProfilesArray_V2 = [(Principal, UserProfile_V2)];

    public type Proposals = [(Nat,Proposal)];

    public type ProposalsMap = HashMap.HashMap<Nat, Proposal>;
    
    public type VotingResults = {
        yay: Nat64;
        nay: Nat64;
        total: Nat64;
    };

    public type Proposal = {
        votes: [(Text, Vote)];
        voteTally: VotingResults;
        action: ProposalActions;
        proposer: Text;
        timeInitiated: Int;
        executed: Bool;
        timeVotingPeriodEnds: Int;
    };

    public type ProposalActions = {
        #AddAdmin: {principal: Text};
        #RemoveAdmin: {principal: Text};
        #LoadUpgrades:{};
        #InstallUpgrades: {};
        #CreateNeuron: {amount: Nat64; };
        #IncreaseNeuron: {amount: Nat64; neuronId: Nat64; };
        #PurchaseCycles: {amount : Nat64;};
        #SpawnNeuron: {neuronId: Nat64; percentage_to_spawn : Nat32;};
        #DisburseNeuron: {neuronId: Nat64; };
        #DissolveNeuron: {neuronId: Nat64; };
        #IncreaseDissolveDelay: {neuronId: Nat64; additionalDissolveDelaySeconds: Nat32; };
        #FollowNeuron: {neuronId: Nat64; topic : Int32; followee :  Nat64 };
        #ToggleSupportMode: {};
    };

    public type Vote = { adopt: Bool };

    public let DEFAULT_DAO_METADATA_V3: DaoMetaData_V3 = {
        managerCanisterPrincipal = "Null";
        treasuryCanisterPrincipal = "Null";
        frontEndPrincipal = "Null";
        backEndPrincipal = "Null";
        lastRecordedBackEndCyclesBalance = 0;
        backEndCyclesBurnRatePerDay = 0;
        admin = [];
        acceptingRequests = true;
        lastRecordedTime = 0;
        supportMode = true;
        requestsForAccess = [];
        defaultControllers = [];
        nftId = null;
        founder = null;
    };


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
        requestsForAccess = [];
        defaultControllers = [];
        nftId = null;
        founder = "Null";
    };

    public type Interface = actor {
        scheduleCanistersToBeUpdatedExceptBackend: () -> async ();
    };

}