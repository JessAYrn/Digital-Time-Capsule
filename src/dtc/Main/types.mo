import Account "../Ledger/Account";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import JournalTypes "../Journal/journal.types";
import NotificationTypes "../Main/types.notifications";
import IC "../IC/ic.types";
import Ledger "../Ledger/Ledger";


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
        email: ?Text; 
        userName: ?Text;
        principal: Text;
    };

    public type UserProfile = {
        canisterId : Principal;
        email: ? Text;
        userName : ? Text;
        userPrincipal: Principal;
        accountId: ?Account.AccountIdentifier;
        approved: ?Bool;
        treasuryMember: ?Bool;
        treasuryContribution: ?Nat64;
        monthsSpentAsTreasuryMember: ?Nat;
    };

    public type ProfileInput = {
        userName: ?Text;
        email: ?Text;
    };

    public type AmountAccepted = {
        accepted: Nat64
    };

    public type UserPermissions = {
        approved: Bool;
        treasuryMember: Bool;
        treasuryContribution: Nat64;
        monthsSpentAsTreasuryMember: Nat;
    };
    

    public type ProfileMetaData = {userPrincipal : Text; canisterId : Text; approvalStatus: Bool;};

    public type ProfilesMetaData = [ProfileMetaData];

    public type CanisterDataExport = {
        journalCount: Nat;
        treasuryCanisterPrincipal: Text;
        managerCanisterPrincipal: Text;
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        nftOwner: Text;
        nftId: Int;
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        profilesMetaData: ProfilesMetaData;
        isOwner: Bool;
        currentCyclesBalance_backend: Nat;
        currentCyclesBalance_frontend: Nat;
        currentCyclesBalance_manager: Nat;
        supportMode: Bool;
        cyclesSaveMode: Bool;
        releaseVersion: Nat;
        requestsForAccess: RequestsForAccess;
    };

    public type AppMetaData = {
        managerCanisterPrincipal: Text; 
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        nftOwner: Text;
        nftId: Int;
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        cyclesSaveMode: Bool;
        supportMode: Bool;
        requestsForAccess: RequestsForAccess;
        defaultControllers: [Principal];
    };

    public type DaoMetaData = {
        managerCanisterPrincipal: Text; 
        treasuryCanisterPrincipal: Text;
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        nftOwner: Text;
        nftId: Int;
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        cyclesSaveMode: Bool;
        supportMode: Bool;
        requestsForAccess: RequestsForAccess;
        defaultControllers: [Principal];
    };

    public type Approved = Bool;

    public type RequestsForAccess = [(Text, Approved)];

    public type CanisterCyclesBalances = {
        backendCyclesBalance : Nat;
        frontendCyclesBalance: Nat
    };


    public type UserProfilesMap = HashMap.HashMap<Principal, UserProfile>;

    public type UserProfilesArray = [(Principal, UserProfile)];

    public let DEFAULT_APP_METADATA: AppMetaData = {
        managerCanisterPrincipal = "Null";
        frontEndPrincipal = "Null";
        backEndPrincipal = "Null";
        lastRecordedBackEndCyclesBalance = 0;
        backEndCyclesBurnRatePerDay = 0;
        nftOwner = "Null";
        nftId = -1;
        acceptingRequests = true;
        lastRecordedTime = 0;
        cyclesSaveMode = false;
        supportMode = false;
        requestsForAccess = [];
        defaultControllers = [];
    };

    public let DEFAULT_DAO_METADATA: DaoMetaData = {
        managerCanisterPrincipal = "Null";
        treasuryCanisterPrincipal = "Null";
        frontEndPrincipal = "Null";
        backEndPrincipal = "Null";
        lastRecordedBackEndCyclesBalance = 0;
        backEndCyclesBurnRatePerDay = 0;
        nftOwner = "Null";
        nftId = -1;
        acceptingRequests = true;
        lastRecordedTime = 0;
        cyclesSaveMode = false;
        supportMode = false;
        requestsForAccess = [];
        defaultControllers = [];
    };

}