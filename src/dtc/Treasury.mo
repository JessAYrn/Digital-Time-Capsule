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
import IC "Types/IC/types";
import EcdsaHelperMethods "Modules/ECDSA/ECDSAHelperMethods";
import Hex "Serializers/Hex";
import Encoder "Serializers/CBOR/Encoder";
import Value "Serializers/CBOR/Value";
import Errors "Serializers/CBOR/Errors";
import Decoder "Serializers/CBOR/Decoder";
import NeuronManager "Modules/HTTPRequests/NeuronManager";
import AnalyticsTypes "Types/Analytics/types";

shared actor class Treasury (principal : Principal) = this {

    private stable let ownerCanisterId : Text = Principal.toText(principal);

    private stable var minimalRequiredVotingPower : Nat64 = 0;

    private stable var tokenBalances : AnalyticsTypes.Balances = {
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

    private stable var depositsArray : TreasuryTypes.TreasuryDepositsArray = [];

    private var depositsMap : TreasuryTypes.TreasuryDepositsMap = 
    HashMap.fromIter<Text, TreasuryTypes.Deposits>(
        Iter.fromArray(depositsArray), 
        Iter.size(Iter.fromArray(depositsArray)), 
        Text.equal,
        Text.hash
    );

    private stable var balancesHistoryArray : AnalyticsTypes.BalancesArray = [];

    private var balancesHistoryMap : AnalyticsTypes.BalancesMap = HashMap.fromIter<Text, AnalyticsTypes.Balances>(
        Iter.fromArray(balancesHistoryArray), 
        Iter.size(Iter.fromArray(balancesHistoryArray)), 
        Text.equal,
        Text.hash
    );

    private stable var memoToNeuronIdArray : TreasuryTypes.MemoToNeuronIdArray = [];

    private var memoToNeuronIdMap : TreasuryTypes.MemoToNeuronIdMap = HashMap.fromIter<TreasuryTypes.Memo, TreasuryTypes.NeuronId>(
        Iter.fromArray(memoToNeuronIdArray), 
        Iter.size(Iter.fromArray(memoToNeuronIdArray)), 
        Nat.equal,
        Hash.hash
    );

    private stable var neuronDataArray : TreasuryTypes.NeuronsDataArray = [];

    private var neuronDataMap : TreasuryTypes.NeuronsDataMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronData>(
        Iter.fromArray(neuronDataArray), 
        Iter.size(Iter.fromArray(neuronDataArray)), 
        Text.equal,
        Text.hash
    );

    private var capacity = 1000000000000;

    private let txFee : Nat64 = 10_000;

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private stable var neuronMemo : Nat64 = 0;

    let {recurringTimer; setTimer} = Timer;

    public query({caller}) func getTreasuryDepositsArray(): async TreasuryTypes.TreasuryDepositsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(depositsMap.entries());
    };

    public query({caller}) func getTreasuryUsersStakesArray(): async TreasuryTypes.UserStakesArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(usersStakesMap.entries());
    };

    public shared({caller}) func userHasSufficientStake(userPrincipal: Principal): async Bool {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let userStakes = usersStakesMap.get(userPrincipal);
        switch(userStakes){
            case null { return false};
            case (?stakes){
                var totalVotingPower : Nat64 = 0;
                let icpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(stakes.icp);
                for( neuronStake in icpNeuronsStakesIter){
                    let {voting_power} = neuronStake.1;
                    totalVotingPower += voting_power;
                };
                if(totalVotingPower < minimalRequiredVotingPower) return false;
                return true;
            };
        };
    };  

    private func getUserNeuronStakeInfo(userPrincipal: Principal, neuronId: Nat64): TreasuryTypes.NeuronStakeInfo {
        let userStakes = usersStakesMap.get(userPrincipal);
        switch(userStakes){
            case null { return  { stake_e8s : Nat64 = 0; voting_power : Nat64 = 0; }; };
            case (?stakes){
                let icpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(stakes.icp);
                let icpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                    icpNeuronsStakesIter, 
                    Iter.size(Iter.fromArray(stakes.icp)), 
                    Text.equal,
                    Text.hash
                );
                switch(icpNeuronsStakesMap.get(Nat64.toText(neuronId))){
                    case null { return  { stake_e8s : Nat64 = 0; voting_power : Nat64 = 0; }; };
                    case(?neuronStake){ return neuronStake; };
                };
            };
        };
    };


    private func updateUserNeuronStakeInfo({ userPrincipal: Principal; newAmount: Nat64; neuronId: Nat64;}): () {
        let userStakeInfo = switch(usersStakesMap.get(userPrincipal)){case null { {icp = [];} }; case(?userStake_){ userStake_ } };
        let {icp} = userStakeInfo;
        let userIcpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(icp);
        let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
            userIcpNeuronsStakesIter, 
            Iter.size(Iter.fromArray(icp)), 
            Text.equal,
            Text.hash
        );
        var userIcpNeuronStake = switch(userIcpNeuronsStakesMap.get(Nat64.toText(neuronId))){
            case null { {stake_e8s : Nat64 = 0; voting_power : Nat64 = 0;} };
            case(?icpNeuronStake_){ icpNeuronStake_ };
        };
        userIcpNeuronStake := {userIcpNeuronStake with stake_e8s = newAmount};
        userIcpNeuronsStakesMap.put(Nat64.toText(neuronId), userIcpNeuronStake);
        usersStakesMap.put(userPrincipal, {userStakeInfo with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())});
        computeNeuronStakeInfosVotingPowers(neuronId);
    };

    private func debitUserIcpDeposits(userPrincipal: Principal, amount: Nat64): () {
        let ?userTotalDeposits = depositsMap.get(Principal.toText(userPrincipal)) else Debug.trap("No deposits for contributor");
        let userAvailableIcpDeposits = userTotalDeposits.icp.total.e8s - userTotalDeposits.icp.collateral.e8s;
        if(userAvailableIcpDeposits < amount) { Debug.trap("Insufficient deposit amount."); };
        updateUserTreasruyDeposits({userPrincipal = Principal.toText(userPrincipal); currency = #Icp; newAmount = #Total(userTotalDeposits.icp.total.e8s - amount)});
    };

    public shared({caller})func creditUserIcpDeposits(userPrincipal: Principal, amount: Nat64): async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let userTotalDeposits = switch(depositsMap.get(Principal.toText(userPrincipal))){
            case null { 
                {
                    icp = {total = {e8s: Nat64 = 0}; collateral = {e8s: Nat64 = 0};}; 
                    icp_staked = {total = {e8s: Nat64 = 0}; collateral = {e8s: Nat64 = 0}; };
                    eth = {total = {e8s: Nat64 = 0}; collateral = {e8s: Nat64 = 0}; };
                    btc = {total = {e8s: Nat64 = 0}; collateral = {e8s: Nat64 = 0}; };
                }; 
            };
            case(?deposits_){ deposits_ };
        };
        updateUserTreasruyDeposits({userPrincipal = Principal.toText(userPrincipal); currency = #Icp; newAmount = #Total(userTotalDeposits.icp.total.e8s + amount)});
    };

    private func creditUserNeuronStake(neuronId: Nat64, userPrincipal: Text, delta: Nat64): () {
        let ?userTotalDeposits = depositsMap.get(userPrincipal) else Debug.trap("No deposits for contributor");
        updateUserTreasruyDeposits({userPrincipal; currency = #Icp_staked; newAmount = #Total(userTotalDeposits.icp_staked.total.e8s + delta)});
        let userNeuronStakeInfo = getUserNeuronStakeInfo(Principal.fromText(userPrincipal), neuronId);
        updateUserNeuronStakeInfo({userPrincipal = Principal.fromText(userPrincipal); newAmount = userNeuronStakeInfo.stake_e8s + delta; neuronId;});
    };

    private func computeNeuronStakeInfosVotingPowers(neuronId: Nat64): () {
        let ?neuronData = neuronDataMap.get(Nat64.toText(neuronId)) else { Debug.trap("No neuronData for neuronId") };
        let ?neuronInfo = neuronData.neuronInfo else { Debug.trap("No neuronInfo for neuronId") };
        let {stake_e8s = neuronTotalStake; voting_power = neuronTotalVotingPower; } = neuronInfo;

        for((userPrincipal, userStakes) in usersStakesMap.entries()){
            let userIcpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(userStakes.icp);
            let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                userIcpNeuronsStakesIter, 
                Iter.size(Iter.fromArray(userStakes.icp)), 
                Text.equal,
                Text.hash
            );
            switch(userIcpNeuronsStakesMap.get(Nat64.toText(neuronId))){
                case(null){};
                case(?userIcpNeuronStake){
                    let {stake_e8s = userTotalStake} = userIcpNeuronStake;
                    let userVotingPower = (userTotalStake * neuronTotalVotingPower) / neuronTotalStake;
                    userIcpNeuronsStakesMap.put(Nat64.toText(neuronId), {userIcpNeuronStake with voting_power = userVotingPower});
                    usersStakesMap.put(userPrincipal, {userStakes with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())});
                };
            };
        };
    };

    private func updateUserTreasruyDeposits({userPrincipal: Text; currency : TreasuryTypes.SupportedCurrencies;newAmount: {#Total: Nat64; #Collateral: Nat64};}): 
    () {
        let deposits = depositsMap.get(userPrincipal);
        var updatedDeposits = switch(deposits){
            case null { 
                {
                    icp = {total = {e8s: Nat64 = 0}; collateral = {e8s: Nat64 = 0};}; 
                    icp_staked = {total = {e8s: Nat64 = 0}; collateral = {e8s: Nat64 = 0}; };
                    eth = {total = {e8s: Nat64 = 0}; collateral = {e8s: Nat64 = 0}; };
                    btc = {total = {e8s: Nat64 = 0}; collateral = {e8s: Nat64 = 0}; };
                }; 
            };
            case(?deposits_){ deposits_ };
        };
        switch(newAmount){
            case(#Total(amount)){
                switch(currency) {
                    case(#Icp){ updatedDeposits := {updatedDeposits with icp = {updatedDeposits.icp with total = {e8s = amount}}}};
                    case(#Icp_staked){ updatedDeposits := {updatedDeposits with icp_staked = {updatedDeposits.icp_staked with total = {e8s = amount}}}};
                    case(#Eth){ updatedDeposits := {updatedDeposits with eth = {updatedDeposits.eth with total = {e8s = amount}}}};
                    case(#Btc){ updatedDeposits := {updatedDeposits with btc = {updatedDeposits.btc with total = {e8s = amount}}}};
                };
            };
            case(#Collateral(amount)){
                switch(currency) {
                    case(#Icp){ updatedDeposits := {updatedDeposits with icp = {updatedDeposits.icp with collateral = {e8s = amount}}}};
                    case(#Icp_staked){ updatedDeposits := {updatedDeposits with icp_staked = {updatedDeposits.icp_staked with collateral = {e8s = amount}}}};
                    case(#Eth){ updatedDeposits := {updatedDeposits with eth = {updatedDeposits.eth with collateral = {e8s = amount}}}};
                    case(#Btc){ updatedDeposits := {updatedDeposits with btc = {updatedDeposits.btc with collateral = {e8s = amount}}}};
                };
            };
        };

        depositsMap.put(userPrincipal, updatedDeposits);
        let timerId = setTimer(#seconds(1), func () : async () { await updateTokenBalances()});
    };

    public shared({caller}) func saveCurrentBalances() : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let icp = await ledger.account_balance({ account = tresasuryAccountId() });
        //will need to retreive the proper balances of the other currencies once they've been integrated
        let icp_staked = {e8s: Nat64 = 0};
        let btc = {e8s: Nat64 = 0};
        let eth = {e8s: Nat64 = 0};
        let balances = {icp; icp_staked; btc; eth;};
        balancesHistoryMap.put(Int.toText(Time.now()), balances);
    };

    public query({caller}) func readBalancesHistory() : async AnalyticsTypes.BalancesArray{
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(balancesHistoryMap.entries());
    };

    private func tresasuryAccountId() : Account.AccountIdentifier {
        Account.accountIdentifier(Principal.fromActor(this), Account.defaultSubaccount())
    };

    public query({caller}) func canisterAccountId() : async Account.AccountIdentifier {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
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


    public shared({caller}) func createNeuron({amount: Nat64; contributor: Principal}) : async IC.http_response  {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        debitUserIcpDeposits(contributor, amount + txFee);
        var pubKey : ?Blob = null;
        var selfAuthPrin : ?Principal = null;
        try{ 
            let { public_key = pubKey_; selfAuthPrincipal = selfAuthPrin_; } = await NeuronManager.transferIcpToNeuronWithMemo(amount, neuronMemo);
            pubKey := ?pubKey_;
            selfAuthPrin := ?selfAuthPrin_;
        } catch(e){
            await creditUserIcpDeposits(contributor, amount + txFee);
            throw e;
        };
        ignore updateTokenBalances();
        let ?selfAuthPrincipal = selfAuthPrin else Debug.trap("No selfAuthPrincipal");
        let ?public_key = pubKey else Debug.trap("No public_key");
        let {response; requestId; ingress_expiry} = await NeuronManager.manageNeuron(
            { id = null; command = ?#ClaimOrRefresh( {by = ?#MemoAndController( {controller = ?selfAuthPrincipal; memo = neuronMemo} )} ); neuron_id_or_subaccount = null; }, 
            selfAuthPrincipal, 
            public_key, 
            transformFn
        );
        if(response.status == 202) { 
            let readRequestResponseInput = {
                requestId; 
                expiry = ingress_expiry; 
                expectedResponseType = #CreateNeuronResponse({memo = neuronMemo; contributor; amount;});
                numberOfFailedAttempts = 0;
            };
            let timerId_1 = setTimer(#seconds(1), func (): async () {let result = await readRequestResponse(readRequestResponseInput) });
            neuronMemo += 1;
        };
        return response;
    };

    public shared({caller}) func increaseNeuron({amount: Nat64; neuronId: Nat64; contributor: Principal}) : async IC.http_response  {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        var pubKey : ?Blob = null;
        var selfAuthPrin : ?Principal = null;
        let ?{neuron; neuronInfo} = neuronDataMap.get(Nat64.toText(neuronId)) else Debug.trap("No neuron for neuronId");
        let {account} = neuron;
        debitUserIcpDeposits(contributor, amount + txFee);
        try{ 
            let { public_key = pubKey_; selfAuthPrincipal = selfAuthPrin_; } = await NeuronManager.transferIcpToNeuronWithSubaccount(amount, account);
            pubKey := ?pubKey_;
            selfAuthPrin := ?selfAuthPrin_;
        } catch(e){
            await creditUserIcpDeposits(contributor, amount + txFee);
            throw e;
        };
        let ?selfAuthPrincipal = selfAuthPrin else Debug.trap("No selfAuthPrincipal");
        let ?public_key = pubKey else Debug.trap("No public_key");
        ignore updateTokenBalances();
        creditUserNeuronStake(neuronId, Principal.toText(contributor), amount);
        let {response; requestId; ingress_expiry} = await NeuronManager.manageNeuron(
            { id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#Subaccount(account); }, 
            selfAuthPrincipal, 
            public_key, 
            transformFn
        );
        if(response.status == 202) { 
            let readRequestResponseInput = {  
                requestId; 
                expiry = ingress_expiry; 
                expectedResponseType = #IncreaseNeuronResponse({neuronId});
                numberOfFailedAttempts = 0;
            };
            let timerId_1 = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(readRequestResponseInput) });
        };
        return response;
    };

    public shared({caller}) func manageNeuron( args: Governance.ManageNeuron): async IC.http_response {
        let canisterId =  Principal.fromActor(this);
        // if(Principal.toText(caller) != Principal.toText(canisterId) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let ?neuronId = args.id else Debug.trap("No neuronId in request");
        let {public_key} = await EcdsaHelperMethods.getPublicKey(null);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let selfAuthPrincipal = Principal.fromBlob(principalAsBlob);
        let ?command = args.command else Debug.trap("No command in request");
        let expectedResponseType = switch(command){
            case(#Spawn(_)) { #Spawn({neuronId = neuronId.id}) };
            case(#Split(_)) { #Split({neuronId = neuronId.id}) };
            case(#Follow(_)) { #Follow({neuronId = neuronId.id}) };
            case(#Configure(_)) { #Configure({neuronId = neuronId.id}) };
            case(#Disburse(_)) { #Disburse({neuronId = neuronId.id}) };
            case(#ClaimOrRefresh(_)) { #ClaimOrRefresh({neuronId = neuronId.id}) };
            case(#RegisterVote(_)) { #RegisterVote({neuronId = neuronId.id}) };
            case(_) {throw Error.reject("Command not supported.")};
        };
        let {response; requestId; ingress_expiry;} = await NeuronManager.manageNeuron( args, selfAuthPrincipal, public_key, transformFn);
        if(response.status == 202) { 
            let readRequestResponseInput = {
                requestId; 
                expiry = ingress_expiry; 
                expectedResponseType;
                numberOfFailedAttempts = 0;
            };
            let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(readRequestResponseInput) });
        };
        return response;
    };

    public query({caller}) func viewNeuronMap() : async TreasuryTypes.NeuronsDataArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(neuronDataMap.entries());
    };

    private func getNeuronData(methodType: TreasuryTypes.NeuronDataMethodTypes) : async IC.http_response {
        let neuronId = switch(methodType){ case(#GetFullNeuronResponse({neuronId})) { neuronId }; case(#GetNeuronInfoResponse({neuronId})) { neuronId }; };
        let {response; requestId; ingress_expiry;} = await NeuronManager.getNeuronData(neuronId, transformFn, methodType);
        if(response.status == 202) { 
            let readRequestResponseInput = {
                requestId; 
                expiry = ingress_expiry; 
                expectedResponseType = methodType;
                numberOfFailedAttempts = 0;
            };
            let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(readRequestResponseInput) });
        };
        return response;
    };

    private func readRequestResponse(input: TreasuryTypes.ReadRequestInput): async TreasuryTypes.RequestResponses  {
        if(input.numberOfFailedAttempts == 3){throw Error.reject("Failed to read request response after 3 attempts.")};
        try{
            let result = await NeuronManager.readRequestResponse(input, transformFn);
            switch(result){
                case(#CreateNeuronResponse({response; memo; contributor; amount;})){
                    let ?neuronId = response.refreshed_neuron_id else Debug.trap("No command in response");
                    memoToNeuronIdMap.put(Nat64.toNat(memo), neuronId.id);
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId = neuronId.id; args = ?{contributor; amount}}))});
                };
                case(#IncreaseNeuronResponse({response; neuronId})){
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null; }))});
                };
                case(#ClaimOrRefresh({response; neuronId;})){
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                };
                case(#Spawn({response; neuronId;})){
                    let ?created_neuron_id = response.created_neuron_id else Debug.trap("No new created_neuron_id in response");
                    let timerId_0 = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                    let timerId_1 = setTimer(#seconds(70), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                };
                case(#Split({response; neuronId;})){
                    let ?created_neuron_id = response.created_neuron_id else Debug.trap("No new created_neuron_id in response");
                    let timerId_0 = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                    let timerId_1 = setTimer(#seconds(70), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                };
                case(#Follow({response; neuronId;})){
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                };
                case(#Configure({response; neuronId;})){
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                };
                case(#Disburse({response; neuronId;})){
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                };
                case(#RegisterVote({response; neuronId;})){
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId; args = null;}))});
                };
                case(#Error(e)){
                    ///TODO: handle error
                };
                case(#GetFullNeuronResponse({response; neuronId; args;})){
                    switch(response){
                        case(#Ok(neuron)){
                            switch(neuronDataMap.get(Nat64.toText(neuronId))){
                                case null { neuronDataMap.put(Nat64.toText(neuronId), {neuron; neuronInfo = null}) };
                                case(?neuronData){ neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuron }); };
                            };
                            let timerId = setTimer(#seconds(10), func (): async () {let result = await getNeuronData(#GetNeuronInfoResponse({neuronId; args}))});
                        }; 
                        case(#Err(e)){ Debug.trap("Received an Error when trying to retreive full neuron info"); };
                    };
                };
                case(#GetNeuronInfoResponse({response; neuronId; args;})){
                    switch(response){
                        case(#Ok(neuronInfo)){
                            switch(neuronDataMap.get(Nat64.toText(neuronId))){
                                case null { Debug.trap("No neuron in neuronDataMap"); };
                                case(?neuronData){
                                    neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuronInfo = ?neuronInfo});
                                    switch(args){
                                        case null {};
                                        case(?{contributor; amount}){
                                            creditUserNeuronStake(neuronId, Principal.toText(contributor), amount);
                                        };
                                    };
                                    computeNeuronStakeInfosVotingPowers(neuronId);
                                };
                            };
                        }; 
                        case(#Err(e)){ Debug.trap("Received an Error when trying to retreive full neuron info"); };
                    };
                };
            };
            return result;
        } catch(e){
            let timerId = setTimer(#seconds(20), func (): async () {let result = await readRequestResponse({input with numberOfFailedAttempts = input.numberOfFailedAttempts + 1})});
            throw Error.reject("No request to read response for.");
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
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
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

    private func refreshNeuronsData() : async () {
        let interval =  12 * 60;
        var index = 0;
        for(neuronData in neuronDataMap.entries()){
            let (neuronId, {neuron; neuronInfo}) = neuronData;
            let ?neuronIdAsNat = Nat.fromText(neuronId) else Debug.trap("Invalid neuronId");
            let timerId = setTimer(
                #seconds(interval * index), 
                func (): async () {let result = await getNeuronData(#GetFullNeuronResponse({neuronId = Nat64.fromNat(neuronIdAsNat); args = null;}))}
            );
            index += 1;
        };
    };

    system func preupgrade() { 
        usersStakesArray := Iter.toArray(usersStakesMap.entries()); 
        depositsArray := Iter.toArray(depositsMap.entries());
        balancesHistoryArray := Iter.toArray(balancesHistoryMap.entries());
        neuronDataArray := Iter.toArray(neuronDataMap.entries());
        memoToNeuronIdArray := Iter.toArray(memoToNeuronIdMap.entries());
    };

    system func postupgrade() { 
        usersStakesArray:= []; 
        depositsArray := [];
        balancesHistoryArray := [];
        neuronDataArray := [];
        memoToNeuronIdArray := [];

        let timerId = recurringTimer(#seconds(7 * 24 * 60 * 60), refreshNeuronsData);
    };    
};