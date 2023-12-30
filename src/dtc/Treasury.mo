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

    private stable var minimalRequiredVotingPower : Nat64 = 0;

    private stable var stakingMultiplier : Nat64 = 2;

    private stable var tokenBalances : TreasuryTypes.Balances = {
        icp = {e8s = 0};
        icp_staked = {e8s = 0};
        eth = {e8s = 0};
        btc = {e8s = 0};
    };

    private stable var usersStakesArray : TreasuryTypes.UserStakesArray = [];

    private var usersStakesMap : TreasuryTypes.UserStakesMap = 
    HashMap.fromIter<Principal, TreasuryTypes.UserStake>(
        Iter.fromArray(usersStakesArray), 
        Iter.size(Iter.fromArray(usersStakesArray)), 
        Principal.equal,
        Principal.hash
    );

    private stable var collateralArray : TreasuryTypes.TreasuryCollateralArray = [];

    private var collateralMap : TreasuryTypes.TreasuryCollateralMap = 
    HashMap.fromIter<Text, TreasuryTypes.Balances>(
        Iter.fromArray(collateralArray), 
        Iter.size(Iter.fromArray(collateralArray)), 
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

    public query({caller}) func getTreasuryCollateralArray(): async TreasuryTypes.TreasuryCollateralArray {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        return Iter.toArray(collateralMap.entries());
    };

    public query({caller}) func getTreasuryUsersStakesArray(): async TreasuryTypes.UserStakesArray {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        return Iter.toArray(usersStakesMap.entries());
    };

    public shared({caller}) func userHasSufficientStake(userPrincipal: Principal): async Bool {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let userStake = usersStakesMap.get(userPrincipal);
        switch(userStake){
            case null { return false};
            case (?stake){
                let { e8s = votingPower } = stake.icp;
                if(votingPower < minimalRequiredVotingPower) return false;
                return true;
            };
        };
    };  

    public shared({caller}) func updateUserTreasruyCollateral({
        userPrincipal: Text; 
        increase: Bool; 
        currency : TreasuryTypes.SupportedCurrencies;
        amount: Nat64
    }) : async Result.Result<TreasuryTypes.TreasuryCollateralArray,TreasuryTypes.Error> {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let collateral = collateralMap.get(userPrincipal);
        var updatedCollateral = {icp = {e8s: Nat64 = 0}; icp_staked = {e8s: Nat64  = 0}; eth = {e8s: Nat64  = 0}; btc = {e8s: Nat64  = 0};};
        var currencyAmount : Nat64 = 0;
        switch(collateral){
            case null { if(increase == false) return #err(#InsufficientFunds)};
            case(?collateral_){ var updatedCollateral = collateral_ };
        };
        switch(currency) {
            case(#Icp){ currencyAmount := updatedCollateral.icp.e8s; };
            case(#Icp_staked){ currencyAmount := updatedCollateral.icp_staked.e8s; };
            case(#Eth){ currencyAmount := updatedCollateral.eth.e8s; };
            case(#Btc){ currencyAmount := updatedCollateral.btc.e8s; };
        };
        if(not increase and currencyAmount < amount) return #err(#InsufficientFunds);
        if(not increase) currencyAmount -= amount;
        if(increase) currencyAmount += amount;
        switch(currency) {
            case(#Icp){ updatedCollateral := {updatedCollateral with icp = {e8s = currencyAmount}}};
            case(#Icp_staked){ updatedCollateral := {updatedCollateral with icp_staked = {e8s = currencyAmount}}};
            case(#Eth){ updatedCollateral := {updatedCollateral with eth = {e8s = currencyAmount}}};
            case(#Btc){ updatedCollateral := {updatedCollateral with btc = {e8s = currencyAmount}}};
        };

        collateralMap.put(userPrincipal, updatedCollateral);
        ignore updateTokenBalances_();
        return #ok(Iter.toArray(collateralMap.entries()));
    };

    public shared({caller}) func saveCurrentBalances() : async () {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let icp = await ledger.account_balance({ account = userAccountId() });
        //will need to retreive the proper balances of the other currencies once they've been integrated
        let icp_staked = {e8s: Nat64 = 0};
        let btc = {e8s: Nat64 = 0};
        let eth = {e8s: Nat64 = 0};
        let balances = {icp; icp_staked; btc; eth;};
        balancesMap.put(Int.toText(Time.now()), balances);
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

    public composite query({caller}) func canisterBalance() : async Ledger.ICP {
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(caller) !=  Principal.toText(canisterId)
            and Principal.toText(caller) != ownerCanisterId
        ) { throw Error.reject("Unauthorized access."); };
        return tokenBalances.icp;
    };

    public shared({caller}) func canisterBalance_shared() : async Ledger.ICP {
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(caller) !=  Principal.toText(canisterId)
            and Principal.toText(caller) != ownerCanisterId
        ) { throw Error.reject("Unauthorized access."); };
        return tokenBalances.icp;
    };

    private func updateTokenBalances_() : async () {
        let icp = await ledger.account_balance({ account = userAccountId() });
        //will have to do the same for the btc and eth ledgers
        tokenBalances := {tokenBalances with icp };
    };

    public query ({caller}) func getCyclesBalance(): async Nat {
        if(Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        return Cycles.balance();
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
        usersStakesArray := Iter.toArray(usersStakesMap.entries()); 
        collateralArray := Iter.toArray(collateralMap.entries());
        balancesArray := Iter.toArray(balancesMap.entries());
    };

    system func postupgrade() { 
        usersStakesArray:= []; 
        collateralArray := [];
        balancesArray := [];
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