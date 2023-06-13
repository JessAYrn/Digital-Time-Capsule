import Account "../Ledger/Account";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import JournalTypes "../Journal/journal.types";
import NotificationTypes "../Main/types.notifications";


module{

    public type JournalData = {
        userJournalData : ([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio,); 
        notifications: NotificationTypes.Notifications;
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

    public type ProfilesApprovalStatuses = [(Text, Approved)];

    public type CanisterDataExport = {
        journalCount: Nat;
        managerCanisterPrincipal: Text;
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        nftOwner: Text;
        nftId: Int;
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        profilesMetaData: ProfilesApprovalStatuses;
        isOwner: Bool;
        currentCyclesBalance_backend: Nat;
        currentCyclesBalance_frontend: Nat;
        currentCyclesBalance_manager: Nat;
        supportMode: Bool;
        cyclesSaveMode: Bool;
    };

    public type CanisterData = {
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
    };

    public type Approved = Bool;

    public type RequestsForAccess = [(Text, Approved)];

    public type CanisterCyclesBalances = {
        backendCyclesBalance : Nat;
        frontendCyclesBalance: Nat
    };


    public type UserProfilesMap = HashMap.HashMap<Principal, UserProfile>;

    public type UserProfilesArray = [(Principal, UserProfile)];

    public let DEFAULT_CANISTER_DATA: CanisterData = {
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
    };

}