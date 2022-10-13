import Journal "../Journal/Journal";
import Account "../Ledger/Account";
import NFT "../NFT/Dip-721-NFT-Container";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";


module{

    public type Profile = {
        journal : Journal.Journal;
        email: ?Text;
        userName: ?Text;
        id: Principal;
        accountId: ?Account.AccountIdentifier;
    };

    public type ProfileInput = {
        userName: ?Text;
        email: ?Text;
    };

    public type AmountAccepted = {
        accepted: Nat64
    };

    public type Nft = {
       nftCollection: NFT.Dip721NFT;
    };

    public type UserPermissions = {
        approved: Bool;
    };

    public type CanisterDataExport = {
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        nftOwner: Text;
        nftId: Int;
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        approvedUsers: [(Text, UserPermissions)];
        isOwner: Bool;
        supportMode: Bool;
    };

    public type CanisterData = {
        frontEndPrincipal: Text;
        backEndPrincipal: Text;
        lastRecordedBackEndCyclesBalance: Nat;
        backEndCyclesBurnRatePerDay: Nat;
        nftOwner: Text;
        nftId: Int;
        acceptingRequests: Bool;
        lastRecordedTime: Int;
        approvedUsers: Trie.Trie<Text, UserPermissions>;
    };

    public type ApprovedUsersExport = [(Text, UserPermissions)];

    public type ProfilesTree = Trie.Trie<Principal, Profile>;

    public type NftCollectionsTree = Trie.Trie<Nat, Nft>;

}