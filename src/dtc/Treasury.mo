import Account "Serializers/Account";
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
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Nat "mo:base/Nat";
import Order "mo:base/Order";
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import GovernanceHelperMethods "Modules/Main/GovernanceHelperMethods";
import NnsCyclesMinting "NNS/NnsCyclesMinting";
import MainTypes "Types/Main/types";
import AnalyticsTypes "Types/Analytics/types";
import IC "Types/IC/types";
import EcdsaHelperMethods "Modules/ECDSA/ECDSAHelperMethods";
import Hex "Serializers/Hex";
import Encoder "Serializers/CBOR/Encoder";
import Value "Serializers/CBOR/Value";
import Errors "Serializers/CBOR/Errors";
import Decoder "Serializers/CBOR/Decoder";
import NeuronManager "Modules/HTTPRequests/NeuronManager";


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

    private stable var neuronDataArray : TreasuryTypes.NeuronInfoArray = [];

    private var neuronDataMap : TreasuryTypes.NeuronInfoMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsNat, Governance.Neuron>(
        Iter.fromArray(neuronDataArray), 
        Iter.size(Iter.fromArray(neuronDataArray)), 
        Nat.equal,
        Hash.hash
    );

    private stable var memoToNeuronIdArray : TreasuryTypes.MemoToNeuronIdArray = [];

    private var memoToNeuronIdMap : TreasuryTypes.MemoToNeuronIdMap = HashMap.fromIter<TreasuryTypes.Memo, TreasuryTypes.NeuronIdAsNat>(
        Iter.fromArray(memoToNeuronIdArray), 
        Iter.size(Iter.fromArray(memoToNeuronIdArray)), 
        Nat.equal,
        Hash.hash
    );

    private var cachedRequest : ?TreasuryTypes.CachedRequest = null;  

    private var capacity = 1000000000000;

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private stable let neuronMemo : Nat64 = 0;

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

    private func getSelfAuthenticatingPrincipal(): async Text {
        let {public_key} = await EcdsaHelperMethods.getPublicKey(null);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        Principal.toText(Principal.fromBlob(principalAsBlob));
    };

    public shared(msg) func getNeuronSubAccountId(): async Text {
        let {public_key} = await EcdsaHelperMethods.getPublicKey(null);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let principal = Principal.fromBlob(principalAsBlob);
        let treasuryNeuronSubaccount = Account.neuronSubaccount(principal, 0);
        Hex.encode(Blob.toArray(treasuryNeuronSubaccount));
    };


    public shared({caller}) func createOrIncreaseNeuron(amount: Nat64, memo: ?Nat64) : async IC.http_response  {
        let canisterId =  Principal.fromActor(this);
        // if(Principal.toText(caller) != Principal.toText(canisterId) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let {setTimer} = Timer;
        switch(cachedRequest){
            case(?cachedRequest_){ 
                let {expiry} = cachedRequest_;
                if(Time.now() > Nat64.toNat(expiry)) { cachedRequest := null; };
                let timerId = setTimer(#seconds(10), func (): async () {let result = await createOrIncreaseNeuron(amount, memo) });
                throw Error.reject("A request is already pending.");
            };
            case(null){
                let memoUsed = switch(memo){ case null { neuronMemo }; case (?memo_) { memo_ }; };
                let {response; requestId; ingress_expiry} =  await NeuronManager.createOrIncreaseNeuron(amount, memoUsed, transformFn);
                if(response.status == 202) { cachedRequest := ?{
                    requestId; 
                    expiry = ingress_expiry; 
                    memoUsed = ?memoUsed;
                    expectedResponseType = #CreateOrIncreaseNeuronResponse;
                    neuronId = null
                };};
                let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(0) });
                return response;

            };
        };
    };

    private func getFullNeuron(args: TreasuryTypes.NeuronId) : async IC.http_response {
        let canisterId =  Principal.fromActor(this);
        let {setTimer} = Timer;
        switch(cachedRequest){
            case(?cachedRequest_){ 
                let {expiry; requestId; expectedResponseType} = cachedRequest_;
                if(Time.now() > Nat64.toNat(expiry)) { cachedRequest := null; };
                let timerId = setTimer(#seconds(10), func (): async () {let result = await getFullNeuron(args) });
                throw Error.reject("A request is already pending.");
            };
            case(null){
                let {response; requestId; ingress_expiry;} = await NeuronManager.getFullNeuron(args, transformFn);
                if(response.status == 202) { cachedRequest := ?{
                    requestId; 
                    expiry = ingress_expiry; 
                    memoUsed = null;
                    expectedResponseType = #GetFullNeuronResponse;
                    neuronId = ?args
                };};
                let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(0) });
                return response;
            };
        };
    };

    public shared({caller}) func manageNeuron( args: Governance.ManageNeuron): async IC.http_response {
        let canisterId =  Principal.fromActor(this);
        // if(Principal.toText(caller) != Principal.toText(canisterId) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let ?neuronId = args.id else Debug.trap("No neuronId in request");
        let {setTimer} = Timer;
        switch(cachedRequest){
            case(?cachedRequest_){ 
                let {expiry; requestId; expectedResponseType} = cachedRequest_;
                if(Time.now() > Nat64.toNat(expiry)) { cachedRequest := null; };
                let timerId = setTimer(#seconds(10), func (): async () {let result = await manageNeuron(args) });
                throw Error.reject("A request is already pending.");
            };
            case(null){
                let {public_key} = await EcdsaHelperMethods.getPublicKey(null);
                let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
                let selfAuthPrincipal = Principal.fromBlob(principalAsBlob);
                let {setTimer} = Timer;
                let ?command = args.command else Debug.trap("No command in request");
                let expectedResponseType = switch(command){
                    case(#Spawn(_)) { #Spawn };
                    case(#Split(_)) { #Split };
                    case(#Follow(_)) { #Follow };
                    case(#Configure(_)) { #Configure };
                    case(#Disburse(_)) { #Disburse };
                    case(#ClaimOrRefresh(_)) { #ClaimOrRefresh };
                    case(#RegisterVote(_)) { #RegisterVote };
                    case(#Merge(_)) { #Merge };
                    case(#DisburseToNeuron(_)) { #DisburseToNeuron };
                    case(#MakeProposal(_)) { #MakeProposal };
                    case(#StakeMaturity(_)) { #StakeMaturity };
                    case(#MergeMaturity(_)) { #MergeMaturity };
                };
                let {response; requestId; ingress_expiry;} = await NeuronManager.manageNeuron( args, selfAuthPrincipal, public_key, transformFn);
                if(response.status == 202) { cachedRequest := ?{
                    requestId; 
                    expiry = ingress_expiry; 
                    expectedResponseType;
                    memoUsed = null;
                    neuronId = ?neuronId.id;
                };};
                let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(0) });
                return response;
            };
        };
    };

    public query(msg) func viewNeuronMap() : async TreasuryTypes.NeuronInfoArray {
        return Iter.toArray(neuronDataMap.entries());
    };

    private func readRequestResponse(numOfFailedAttempts: Nat): async TreasuryTypes.RequestResponses  {
        if(numOfFailedAttempts == 3){cachedRequest := null; Debug.trap("Failed to read request response after 3 attempts.")};
        let {setTimer} = Timer;
        switch(cachedRequest){
            case null { 
                let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(numOfFailedAttempts + 1)});
                throw Error.reject("No request to read response for.");
            };
            case(?cachedRequest_){ 
                try{
                    let result = await NeuronManager.readRequestResponse(cachedRequest_, transformFn);
                    switch(result){
                        case(#CreateOrIncreaseNeuronResponse(response)){
                            let ?memoUsed = cachedRequest_.memoUsed else Debug.trap("No memo used in request");
                            let ?nueronId = response.refreshed_neuron_id else Debug.trap("No command in response");
                            memoToNeuronIdMap.put(Nat64.toNat(memoUsed), Nat64.toNat(nueronId.id));
                            cachedRequest := null;
                            let timerId = setTimer(#seconds(10), func (): async () {let result = await getFullNeuron(nueronId.id)});
                        };
                        case(#ClaimOrRefresh(response)){
                            let ?nueronId = response.refreshed_neuron_id else Debug.trap("No command in response");
                            cachedRequest := null;
                            let timerId = setTimer(#seconds(10), func (): async () {let result = await getFullNeuron(nueronId.id)});
                        };
                        case(#Spawn(response)){
                            ///TODO: handle response
                        };
                        case(#Split(response)){
                            ///TODO: handle response
                        };
                        case(#Follow(response)){
                            ///TODO: handle response
                        };
                        case(#Configure(response)){
                            ///TODO: handle response
                        };
                        case(#Disburse(response)){
                            ///TODO: handle response
                        };
                        case(#RegisterVote(response)){
                            ///TODO: handle response
                        };
                        case(#Merge(response)){
                            /// TODO: handle response
                        };
                        case(#DisburseToNeuron(response)){
                            ///TODO: handle response
                        };
                        case(#MakeProposal(response)){
                            ///TODO: handle response
                        };
                        case(#StakeMaturity(response)){
                            ///TODO: handle response
                        };
                        case(#MergeMaturity(response)){
                            ///TODO: handle response
                        };
                        case(#Error(e)){
                            ///TODO: handle error
                        };
                        case(#GetFullNeuronResponse(response)){
                            switch(response){
                                case(#Ok(neuron)){
                                    let ?neuronId = cachedRequest_.neuronId else Debug.trap("No neuronId in request");
                                    neuronDataMap.put(Nat64.toNat(neuronId), neuron);
                                    cachedRequest := null;
                                }; 
                                case(#Err(e)){ 
                                    Debug.trap("Received an Error when trying to retreive full neuron info"); 
                                }
                            };
                        };
                    };
                    return result;
                } catch(e){
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(numOfFailedAttempts + 1)});
                    throw Error.reject("No request to read response for.");
                };
            };
        };
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

    public query func transformFn({ response : IC.http_response; context: Blob }) : async IC.http_response {
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
        neuronDataArray := Iter.toArray(neuronDataMap.entries());
        memoToNeuronIdArray := Iter.toArray(memoToNeuronIdMap.entries());
    };

    system func postupgrade() { 
        usersStakesArray:= []; 
        collateralArray := [];
        balancesArray := [];
        neuronDataArray := [];
        memoToNeuronIdArray := [];
    };    
};