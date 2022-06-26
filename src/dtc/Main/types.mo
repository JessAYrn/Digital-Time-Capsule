import Journal "../Journal/Journal";
import Account "../Ledger/Account";
import NFT "../NFT/Dip-721-NFT-Container";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import MainTypes "../Main/types";


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

    public type ProfilesTree = Trie.Trie<Principal, Profile>;

    public type NftCollectionsTree = Trie.Trie<Nat, MainTypes.Nft>;

}