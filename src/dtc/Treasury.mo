import Account "Ledger/Account";
import Ledger "Ledger/Ledger";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import TreasuryTypes "Types/Treasury/types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Float "mo:base/Float";
import Int64 "mo:base/Int64";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Time "mo:base/Time";
import GovernanceHelperMethods "Modules/Main/GovernanceHelperMethods";
import NnsCyclesMinting "Ledger/NnsCyclesMinting";
import MainTypes "Types/Main/types";
import AnalyticsTypes "Types/Analytics/types";

shared(msg) actor class Treasury (principal : Principal) = this {

    private stable let ownerCanisterId : Text = Principal.toText(principal);

    private stable var contributorsArray : TreasuryTypes.TreasuryContributorsArray = [];

    private stable var minimalRequiredVotingPower : Nat64 = 0;

    private stable var stakingMultiplier : Nat64 = 2;

    private var contributorsMap : TreasuryTypes.TreasuryContributorsMap = 
    HashMap.fromIter<Text, TreasuryTypes.Balances>(
        Iter.fromArray(contributorsArray), 
        Iter.size(Iter.fromArray(contributorsArray)), 
        Text.equal,
        Text.hash
    );

    private stable var balancesArray : AnalyticsTypes.BalancesArray = [];

    private var balancesMap : AnalyticsTypes.BalancesMap = HashMap.fromIter<Text, AnalyticsTypes.Balances>(
        Iter.fromArray(balancesArray), 
        Iter.size(Iter.fromArray(balancesArray)), 
        Text.equal,
        Text.hash
    );

    private var capacity = 1000000000000;

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public query({caller}) func getTreasuryContributionsArray(): async TreasuryTypes.TreasuryContributorsArray {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        return Iter.toArray(contributorsMap.entries());
    };

    public shared({caller}) func userHasSufficientContributions(userPrincipal: Principal): async Bool {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let userContributions = contributorsMap.get(Principal.toText(userPrincipal));
        switch(userContributions){
            case null { return false};
            case (?balances){
                let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
                let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
                let {xdr_permyriad_per_icp} = data;
                let votingPower = GovernanceHelperMethods.computeTotalXdrs({balances; xdr_permyriad_per_icp; });
                if(votingPower < Float.fromInt64(Int64.fromNat64(minimalRequiredVotingPower))) return false;
                return true;
            };
        };
    };  

    public shared({caller}) func updateUserTreasruyContributions({
        userPrincipal: Text; 
        increase: Bool; 
        currency : TreasuryTypes.SupportedCurrencies;
        amount: Nat64
    }) : async Result.Result<TreasuryTypes.TreasuryContributorsArray,TreasuryTypes.Error> {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let contributions = contributorsMap.get(userPrincipal);
        var updatedContributions = {icp = {e8s: Nat64 = 0}; icp_staked = {e8s: Nat64  = 0}; eth = {e8s: Nat64  = 0}; btc = {e8s: Nat64  = 0};};
        var currencyAmount : Nat64 = 0;
        switch(contributions){
            case null { if(increase == false) return #err(#InsufficientFunds)};
            case(?contributions_){ var updatedContributions = contributions_ };
        };
        switch(currency) {
            case(#Icp){ currencyAmount := updatedContributions.icp.e8s; };
            case(#Icp_staked){ currencyAmount := updatedContributions.icp_staked.e8s; };
            case(#Eth){ currencyAmount := updatedContributions.eth.e8s; };
            case(#Btc){ currencyAmount := updatedContributions.btc.e8s; };
        };
        if(not increase and currencyAmount < amount) return #err(#InsufficientFunds);
        if(not increase) currencyAmount -= amount;
        if(increase) currencyAmount += amount;
        switch(currency) {
            case(#Icp){ updatedContributions := {updatedContributions with icp = {e8s = currencyAmount}}};
            case(#Icp_staked){ updatedContributions := {updatedContributions with icp_staked = {e8s = currencyAmount}}};
            case(#Eth){ updatedContributions := {updatedContributions with eth = {e8s = currencyAmount}}};
            case(#Btc){ updatedContributions := {updatedContributions with btc = {e8s = currencyAmount}}};
        };

        contributorsMap.put(userPrincipal, updatedContributions);
        return #ok(Iter.toArray(contributorsMap.entries()));
    };

    public shared({caller}) func saveCurrentBalances() : async () {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let icp = await canisterBalance();
        //will need to retreive the proper balances of the other currencies once they've been integrated
        let icp_staked = {e8s: Nat64 = 0};
        let btc = {e8s: Nat64 = 0};
        let eth = {e8s: Nat64 = 0};
        let balances = {icp; icp_staked; btc; eth;};
        let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
        let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
        let {xdr_permyriad_per_icp} = data;
        let xdrs = GovernanceHelperMethods.computeTotalXdrs({balances; xdr_permyriad_per_icp});
        balancesMap.put(Int.toText(Time.now()), {balances with xdrs});
    };

    public query({caller}) func readBalancesHistory() : async AnalyticsTypes.BalancesArray{
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        return Iter.toArray(balancesMap.entries());
    };

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

    // Return the cycles received up to the capacity allowed
    public func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = capacity - Cycles.balance();
        let accepted = 
            if (amount <= limit) amount
            else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        { accepted = Nat64.fromNat(accepted) };
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