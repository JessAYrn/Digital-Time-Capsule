import Account "HashersAndSerializers/Account";
import Ledger "NNS/Ledger";
import Governance "NNS/Governance";
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
import Nat32 "mo:base/Nat32";
import Blob "mo:base/Blob";
import GovernanceHelperMethods "Modules/Main/GovernanceHelperMethods";
import NnsCyclesMinting "NNS/NnsCyclesMinting";
import MainTypes "Types/Main/types";
import AnalyticsTypes "Types/Analytics/types";
import IC "Types/IC/types";
import EcdsaHelperMethods "Modules/ECDSA/ECDSAHelperMethods";
import Hex "HashersAndSerializers/Hex";


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

    private stable var neuronID : Nat64 = 0;

    private var capacity = 1000000000000;

    private let txFee : Nat64 = 10_000;

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private let neuronMemo : Nat64 = 0;

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
        ignore updateTokenBalances();
        return #ok(Iter.toArray(collateralMap.entries()));
    };

    public shared({caller}) func saveCurrentBalances() : async () {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let icp = await ledger.account_balance({ account = tresasuryAccountId() });
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

    private func tresasuryAccountId() : Account.AccountIdentifier {
        Account.accountIdentifier(Principal.fromActor(this), Account.defaultSubaccount())
    };

    public query({caller}) func canisterAccountId() : async Account.AccountIdentifier {
        if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        tresasuryAccountId()
    };

    private func getTreasuryNeuronAccountId(memo: Nat64) : async Account.AccountIdentifier {
        let {public_key} = await EcdsaHelperMethods.getPublicKey(null, Principal.fromActor(this));
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let principal = Principal.fromBlob(principalAsBlob);
        let treasuryNeuronSubaccount = Account.neuronSubaccount(principal, memo);
        Account.accountIdentifier(Principal.fromText(Governance.CANISTER_ID), treasuryNeuronSubaccount);
    };

    public shared({caller}) func getNeuronAccountId() : async Text {
        // if( Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let accountId = await getTreasuryNeuronAccountId(neuronMemo);
        let accountId_ = Hex.encode(Blob.toArray(accountId));
    };

    public shared(msg) func getSelfAuthenticatingPrincipal(): async Text {
        let {public_key} = await EcdsaHelperMethods.getPublicKey(null, Principal.fromActor(this));
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        Principal.toText(Principal.fromBlob(principalAsBlob));
    };

    public shared(msg) func getNeuronSubAccountId(): async Text {
        let {public_key} = await EcdsaHelperMethods.getPublicKey(null, Principal.fromActor(this));
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let principal = Principal.fromBlob(principalAsBlob);
        let treasuryNeuronSubaccount = Account.neuronSubaccount(principal, 0);
        Hex.encode(Blob.toArray(treasuryNeuronSubaccount));
    };

    public query({caller}) func canisterBalance() : async Ledger.ICP {
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(caller) !=  Principal.toText(canisterId)
            and Principal.toText(caller) != ownerCanisterId
        ) { throw Error.reject("Unauthorized access."); };
        return tokenBalances.icp;
    };

    public shared({caller}) func updateTokenBalances() : async () {
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(caller) !=  Principal.toText(canisterId)
            and Principal.toText(caller) != ownerCanisterId
        ) { throw Error.reject("Unauthorized access."); };
        let icp = await ledger.account_balance({ account = tresasuryAccountId() });
        //will have to do the same for the btc and eth ledgers
        tokenBalances := {tokenBalances with icp };
    };

    public query ({caller}) func getCyclesBalance(): async Nat {
        if(Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        return Cycles.balance();
    };

    public shared(msg) func manageNeuron(args: Governance.ManageNeuron): async IC.http_response_with_text {
        let this_canister_id: Principal = Principal.fromActor(this);
        let {public_key} = await EcdsaHelperMethods.getPublicKey(null, this_canister_id);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let sender = Principal.fromBlob(principalAsBlob);
        let canister_id: Principal = Principal.fromText(Governance.CANISTER_ID);
        let method_name: Text = "simulate_manage_neuron";
        let request = await EcdsaHelperMethods.prepareCanisterCallViaEcdsa({sender; public_key; canister_id; this_canister_id; args; method_name;});
        let {envelope} = await EcdsaHelperMethods.getSignedEnvelope(request, this_canister_id);
        let body = ?to_candid(envelope);
        let {request_url = url} = request;
        let max_response_bytes: ?Nat64 = ?Nat64.fromNat(1024 * 1024);
        let method = #post;
        let transform_context = { function = transformFn; context = Blob.fromArray([]); };
        let transform = ?transform_context;
        let headers = [{name = "content-type"; value= "application/cbor"}];
        let ic : IC.Self = actor("aaaaa-aa");
        let http_request = {body; url; headers; transform; method; max_response_bytes};
        Cycles.add(20_949_972_000);
        let {status; body = responseBodyAsBlob; headers = responseHeaders} : IC.http_response = await ic.http_request(http_request);
        return { status; body = Text.decodeUtf8(responseBodyAsBlob); headers };
    };
    
    public shared({caller})func createNeuron(amount: Nat64, memo: Nat64): async IC.http_response_with_text{
        // let canisterId =  Principal.fromActor(this);
        // if(  Principal.toText(caller) !=  Principal.toText(canisterId) and Principal.toText(caller) != ownerCanisterId) throw Error.reject("Unauthorized access."); 
        let treasuryNeuronAccountId = await getTreasuryNeuronAccountId(memo);
        let res = await ledger.transfer({
          memo = memo;
          from_subaccount = null;
          to = treasuryNeuronAccountId;
          amount = { e8s = amount };
          fee = { e8s = txFee };
          created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
        });
        switch(res){
            case (#Err(_)) { return throw Error.reject("Transfer NNS neuron failed")};
            case (#Ok(blockIndex)) {
                let neuronSubaccountId = Account.neuronSubaccount(Principal.fromActor(this), memo);
                let response = await manageNeuron({ 
                    id = null; 
                    command = ?#ClaimOrRefresh({ by = ?#MemoAndController({controller = ?Principal.fromActor(this); memo = memo; }); });
                    neuron_id_or_subaccount = ?#Subaccount (neuronSubaccountId);
                });
                return response;
            };
        };
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

    public query func transformFn({context: Blob; response: IC.http_response}) : async IC.http_response {
      let transformed : IC.http_response = {
        status = response.status;
        body = response.body;
        headers = [];
      };
      transformed;
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
};