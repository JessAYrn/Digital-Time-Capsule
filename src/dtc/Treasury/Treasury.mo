import Account "../Ledger/Account";
import Ledger "../Ledger/Ledger";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import TreasuryTypes "treasury.types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";

shared(msg) actor class Treasury (principal : Principal) = this {

    private stable let ownerCanisterId : Text = Principal.toText(principal);

    private stable var contributorsArray : TreasuryTypes.ContributorsArray = [];

    private var contributorsMap : TreasuryTypes.ContributorsMap = HashMap.fromIter<Principal, TreasuryTypes.Contributions>(
        Iter.fromArray(contributorsArray), 
        Iter.size(Iter.fromArray(contributorsArray)), 
        Principal.equal,
        Principal.hash
    );

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private func userAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query({caller}) func canisterAccount() : async Account.AccountIdentifier {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        userAccountId()
    };

    public shared({caller}) func canisterBalance() : async Ledger.ICP {
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(caller) !=  Principal.toText(canisterId)
            and Principal.toText(caller) != ownerCanisterId
        ) { throw Error.reject("Unauthorized access."); };
        await ledger.account_balance({ account = userAccountId() })
    };

    system func preupgrade() {
    };

    system func postupgrade() {
    };
   
    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)}
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };

    private func textKey(x: Text) : Trie.Key<Text> {
        return {key = x; hash = Text.hash(x)}
    };

}