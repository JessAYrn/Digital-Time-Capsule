import TreasuryTypes "../../Types/Treasury/types";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Nat64 "mo:base/Nat64";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import Error "mo:base/Error";
import NeuronManager "../HTTPRequests/NeuronManager";
import IC "../../Types/IC/types";
import Governance "../../NNS/Governance";
import EcdsaHelperMethods "../ECDSA/ECDSAHelperMethods";
import Account "../../Serializers/Account";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Time "mo:base/Time";

module{

    let {setTimer} = Timer;

    let txFee: Nat64 = 10_000;

    public let PENDING_NEURON_SUFFIX = "_pendingNeuron";

    public func userHasSufficientStake(userPrincipal: Principal, usersStakesMap: TreasuryTypes.UserStakesMap, minimalRequiredVotingPower: Nat64): 
    Bool {
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

    public func getUserNeuronStakeInfo(userPrincipal: Principal,usersStakesMap: TreasuryTypes.UserStakesMap, neuronId: Text): TreasuryTypes.NeuronStakeInfo {
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
                switch(icpNeuronsStakesMap.get(neuronId)){
                    case null { return  { stake_e8s : Nat64 = 0; voting_power : Nat64 = 0; }; };
                    case(?neuronStake){ return neuronStake; };
                };
            };
        };
    };

    public func splitNeuronStakeInfo(
        sourceNeuronId: Nat64, 
        targetNeuronId: Nat64, 
        splitAmount: Nat64,
        usersStakesMap: TreasuryTypes.UserStakesMap, 
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
    ): () {
        let ?{neuron; neuronInfo} = neuronDataMap.get(Nat64.toText(sourceNeuronId)) else { Debug.trap("No neuronData for neuronId") };
        let ?neuronStakeInfo_ = neuronInfo else { Debug.trap("No neuronInfo for neuronId") };
        let {stake_e8s = oldNeuronTotalStake} = neuronStakeInfo_;
        var splitAmount_: Nat64 = 0;

        for((userPrincipal, userStakes) in usersStakesMap.entries()){
            let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                Iter.fromArray(userStakes.icp), 
                Iter.size(Iter.fromArray(userStakes.icp)), 
                Text.equal,
                Text.hash
            );
            switch(userIcpNeuronsStakesMap.get(Nat64.toText(sourceNeuronId))){
                case(null){};
                case(?oldNeuronStakeInfo){
                    let {stake_e8s = oldNeuronStake} = oldNeuronStakeInfo;
                    let newNeuronStake = (oldNeuronStake * splitAmount) / oldNeuronTotalStake;
                    splitAmount_ += newNeuronStake;
                    userIcpNeuronsStakesMap.put(Nat64.toText(sourceNeuronId), {oldNeuronStakeInfo with stake_e8s = oldNeuronStake - newNeuronStake});
                    userIcpNeuronsStakesMap.put(Nat64.toText(targetNeuronId), {stake_e8s = newNeuronStake; voting_power = 0});
                    usersStakesMap.put(userPrincipal, {userStakes with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())});
                };
            };
        };
        computeNeuronStakeInfosVotingPowers(neuronDataMap, usersStakesMap, Nat64.toText(sourceNeuronId));
        computeNeuronStakeInfosVotingPowers(neuronDataMap, usersStakesMap, Nat64.toText(targetNeuronId));
    };

    private func finalizeNewNeuronStakeInfo(
        placeHolderKey: Text,  
        newNeuronId: Nat64,
        usersStakesMap: TreasuryTypes.UserStakesMap
    ): () {
        for((userPrincipal, userStakes) in usersStakesMap.entries()){
            let userIcpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(userStakes.icp);
            let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                userIcpNeuronsStakesIter, 
                Iter.size(Iter.fromArray(userStakes.icp)), 
                Text.equal,
                Text.hash
            );
            switch(userIcpNeuronsStakesMap.get(placeHolderKey)){
                case(null){};
                case(?newNeuronStakeInfo){
                    userIcpNeuronsStakesMap.put(Nat64.toText(newNeuronId), newNeuronStakeInfo);
                    let _ = userIcpNeuronsStakesMap.remove(placeHolderKey);
                    usersStakesMap.put(userPrincipal, {userStakes with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())});
                };
            };
        };
    };
    
    public func computeNeuronStakeInfosVotingPowers(
        neuronDataMap:TreasuryTypes.NeuronsDataMap, 
        usersStakesMap:TreasuryTypes.UserStakesMap,
        neuronId: Text
    ): () {
        let ?neuronData = neuronDataMap.get(neuronId) else { return };
        let ?neuronInfo = neuronData.neuronInfo else { return };
        let {stake_e8s = neuronTotalStake; voting_power = neuronTotalVotingPower; } = neuronInfo;

        for((userPrincipal, userStakes) in usersStakesMap.entries()){
            let userIcpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(userStakes.icp);
            let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                userIcpNeuronsStakesIter, 
                Iter.size(Iter.fromArray(userStakes.icp)), 
                Text.equal,
                Text.hash
            );
            switch(userIcpNeuronsStakesMap.get(neuronId)){
                case(null){};
                case(?userIcpNeuronStake){
                    let {stake_e8s = userTotalStake} = userIcpNeuronStake;
                    let userVotingPower = (userTotalStake * neuronTotalVotingPower) / neuronTotalStake;
                    userIcpNeuronsStakesMap.put(neuronId, {userIcpNeuronStake with voting_power = userVotingPower});
                    usersStakesMap.put(userPrincipal, {userStakes with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())});
                };
            };
        };
    };

    public func updateUserNeuronStakeInfo(
        neuronDataMap:TreasuryTypes.NeuronsDataMap, 
        usersStakesMap:TreasuryTypes.UserStakesMap,
        { userPrincipal: Principal; newAmount: Nat64; neuronId: Text;}
    ): () {
        let userStakeInfo = switch(usersStakesMap.get(userPrincipal)){case null { {icp = [];} }; case(?userStake_){ userStake_ } };
        let {icp} = userStakeInfo;
        let userIcpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(icp);
        let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
            userIcpNeuronsStakesIter, 
            Iter.size(Iter.fromArray(icp)), 
            Text.equal,
            Text.hash
        );
        var userIcpNeuronStake = switch(userIcpNeuronsStakesMap.get(neuronId)){
            case null { {stake_e8s : Nat64 = 0; voting_power : Nat64 = 0;} };
            case(?icpNeuronStake_){ icpNeuronStake_ };
        };
        userIcpNeuronStake := {userIcpNeuronStake with stake_e8s = newAmount};
        userIcpNeuronsStakesMap.put(neuronId, userIcpNeuronStake);
        usersStakesMap.put(userPrincipal, {userStakeInfo with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())});
        computeNeuronStakeInfosVotingPowers(neuronDataMap, usersStakesMap, neuronId);
    };

    public func creditUserNeuronStake(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersStakesMap: TreasuryTypes.UserStakesMap,
        depositsMap: TreasuryTypes.TreasuryDepositsMap, 
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Text; delta: Nat64; neuronId: Text }
    ): () {
        let userTotalDeposits = switch(depositsMap.get(userPrincipal)){
            case(?deposits_){ deposits_ };
            case null { 
                {
                    icp = {e8s : Nat64 = 0};
                    icp_staked = {e8s : Nat64 = 0};
                    eth = {e8s : Nat64 = 0};
                    btc = {e8s : Nat64 = 0};
                } 
            }
        };
        updateUserTreasruyDeposits(depositsMap,updateTokenBalances, {userPrincipal; currency = #Icp_staked; newAmount = userTotalDeposits.icp_staked.e8s + delta});
        let userNeuronStakeInfo = getUserNeuronStakeInfo(Principal.fromText(userPrincipal), usersStakesMap, neuronId);
        updateUserNeuronStakeInfo( neuronDataMap, usersStakesMap, {userPrincipal = Principal.fromText(userPrincipal); newAmount = userNeuronStakeInfo.stake_e8s + delta; neuronId;});
    };

    public func updateUserTreasruyDeposits(
        depositsMap: TreasuryTypes.TreasuryDepositsMap, 
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Text; currency : TreasuryTypes.SupportedCurrencies; newAmount: Nat64;}): 
    () {
        let deposits = depositsMap.get(userPrincipal);
        var updatedDeposits = switch(deposits){
            case null { 
                {
                    icp = {e8s: Nat64 = 0 }; 
                    icp_staked = {e8s: Nat64 = 0 };
                    eth = {e8s: Nat64 = 0 };
                    btc = {e8s: Nat64 = 0 };
                }; 
            };
            case(?deposits_){ deposits_ };
        };
        switch(currency) {
            case(#Icp){ updatedDeposits := {updatedDeposits with icp = {e8s = newAmount}}};
            case(#Icp_staked){ updatedDeposits := {updatedDeposits with icp_staked = {e8s = newAmount}}};
            case(#Eth){ updatedDeposits := {updatedDeposits with eth = {e8s = newAmount}}};
            case(#Btc){ updatedDeposits := {updatedDeposits with btc = {e8s = newAmount}}};
        };

        depositsMap.put(userPrincipal, updatedDeposits);
        let timerId = setTimer(#seconds(1), func () : async () { await updateTokenBalances()});
    };

    public func debitUserIcpDeposits(
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Principal; amount: Nat64}): () {
        let ?userTotalDeposits = depositsMap.get(Principal.toText(userPrincipal)) else Debug.trap("No deposits for contributor");
        if(userTotalDeposits.icp.e8s < amount) { Debug.trap("Insufficient deposit amount."); };
        updateUserTreasruyDeposits(depositsMap, updateTokenBalances, {userPrincipal = Principal.toText(userPrincipal); currency = #Icp; newAmount = userTotalDeposits.icp.e8s - amount});
    };

    public func creditUserIcpDeposits(
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Principal; amount: Nat64}): () {
        let userTotalDeposits = switch(depositsMap.get(Principal.toText(userPrincipal))){
            case null { 
                {
                    icp = {e8s: Nat64 = 0}; 
                    icp_staked = {e8s: Nat64 = 0};
                    eth = {e8s: Nat64 = 0};
                    btc = {e8s: Nat64 = 0};
                }; 
            };
            case(?deposits_){ deposits_ };
        };
        updateUserTreasruyDeposits(depositsMap,updateTokenBalances, {userPrincipal = Principal.toText(userPrincipal); currency = #Icp; newAmount = userTotalDeposits.icp.e8s + amount});
    };

    public func refreshNeuronsData(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersStakesMap: TreasuryTypes.UserStakesMap,
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature
    ) : async () {


        let {public_key} = await EcdsaHelperMethods.getPublicKey(null);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let selfAuthPrincipal = Principal.fromBlob(principalAsBlob);

        for((_, neuronData) in neuronDataMap.entries()){
            let {neuron} = neuronData;
            let {account;} = neuron;
            let ?neuronId = neuron.id else return;

            let newPendingAction: TreasuryTypes.PendingAction = {
                args = ?{ id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#Subaccount(account); };
                expectedResponseType = #ClaimOrRefresh({neuronId = neuronId.id; });
                selfAuthPrincipal;
                public_key;
            };
            pendingActionsMap.put("claimOrRefresh_"#Nat64.toText(neuronId.id), newPendingAction);
        };

        ignore resolvePendingActions( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn );
    };

    public func getNeuronData(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersStakesMap: TreasuryTypes.UserStakesMap,
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature,
        methodType: TreasuryTypes.NeuronDataMethodTypes
    ) : async () {

        let (neuronId, pendingActionId) : (Nat64, Text) = switch(methodType){ 
            case(#GetFullNeuronResponse({neuronId})) { (neuronId, "getFullNeuronResponse_"#Nat64.toText(neuronId)) }; 
            case(#GetNeuronInfoResponse({neuronId})) { (neuronId, "getNeuronInfoResponse_"#Nat64.toText(neuronId)) }; 
        };

        let {public_key} = await EcdsaHelperMethods.getPublicKey(null);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let selfAuthPrincipal = Principal.fromBlob(principalAsBlob);
        let newPendingAction: TreasuryTypes.PendingAction = {
            args = null;
            expectedResponseType = methodType;
            selfAuthPrincipal;
            public_key;
        };
        activityLogsMap.put(Int.toText(Time.now()), "Refreshing Neuron Data for neuron with Id: "#Nat64.toText(neuronId));
        activityLogsMap.put(Int.toText(Time.now()), "New Action Pending: "#pendingActionId);
        pendingActionsMap.put(pendingActionId, newPendingAction);
        ignore resolvePendingActions(neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn);
    };

    public func readRequestResponse(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersStakesMap: TreasuryTypes.UserStakesMap,
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature,
        input: TreasuryTypes.ReadRequestInput
    ): async TreasuryTypes.RequestResponses  {
        if(input.numberOfFailedAttempts == 3){
            activityLogsMap.put(Int.toText(Time.now()),"Failed to read response to HTTPS request after 3 attempts. No further attempts will be made.");
            throw Error.reject("Failed to read request response after 3 attempts.")
        };
        try{
            activityLogsMap.put(Int.toText(Time.now()),"reading response to HTTPS request to NNS governance canister.");
            let result = await NeuronManager.readRequestResponse(input, transformFn);
            switch(result){
                case(#CreateNeuronResponse({response; memo; newNeuronIdPlaceholderKey;})){
                    let ?neuronId = response.refreshed_neuron_id else {
                        activityLogsMap.put(Int.toText(Time.now()), "Failed to complete action: No neuronId in response");
                        Debug.trap("No neuronId in response");
                    };
                    memoToNeuronIdMap.put(Nat64.toNat(memo), neuronId.id);
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap,  memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId = neuronId.id;}));
                    finalizeNewNeuronStakeInfo(newNeuronIdPlaceholderKey, neuronId.id, usersStakesMap);
                    let _ = pendingActionsMap.remove("createNeuronResponse_"#Nat64.toText(memo));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: createNeuronResponse_"#Nat64.toText(memo));
                };
                case(#ClaimOrRefresh({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    let _ = pendingActionsMap.remove("claimOrRefresh_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: claimOrRefresh_"#Nat64.toText(neuronId));
                };
                case(#Spawn({response; neuronId;})){
                    let ?created_neuron_id = response.created_neuron_id else{
                        activityLogsMap.put(Int.toText(Time.now()),"Failed to complete action: No new created_neuron_id in response");
                        Debug.trap("No new created_neuron_id in response"); 
                    };
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap ,memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId = created_neuron_id.id;}) );
                    let _ = pendingActionsMap.remove("spawn_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: spawn_"#Nat64.toText(neuronId));
                };
                case(#Split({response; neuronId; amount_e8s; })){
                    let ?created_neuron_id = response.created_neuron_id else {
                        activityLogsMap.put(Int.toText(Time.now()),"Failed to complete action: No new created_neuron_id in response");
                        Debug.trap("No new created_neuron_id in response");
                    };
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId = created_neuron_id.id;}));
                    let splitAmount = splitNeuronStakeInfo(neuronId, created_neuron_id.id,amount_e8s, usersStakesMap, neuronDataMap);
                    let _ = pendingActionsMap.remove("split_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: split_"#Nat64.toText(neuronId));
                };
                case(#Follow({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    let _ = pendingActionsMap.remove("follow_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: follow_"#Nat64.toText(neuronId));
                };
                case(#Configure({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    let _ = pendingActionsMap.remove("configure_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: configure_"#Nat64.toText(neuronId));
                };
                case(#Disburse({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    let _ = pendingActionsMap.remove("disburse_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: disburse_"#Nat64.toText(neuronId));
                };
                case(#RegisterVote({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    let _ = pendingActionsMap.remove("registerVote_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: registerVote_"#Nat64.toText(neuronId));
                };
                case(#Error({response;})){
                    activityLogsMap.put(Int.toText(Time.now()),"HTTPS outcall returned error message from NNS governance canister. Error: "#response.error_message);
                };
                case(#GetFullNeuronResponse({response; neuronId;})){
                    switch(response){
                        case(#Ok(neuron)){
                            switch(neuronDataMap.get(Nat64.toText(neuronId))){
                                case null { neuronDataMap.put(Nat64.toText(neuronId), {neuron; neuronInfo = null}) };
                                case(?neuronData){ neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuron }); };
                            };
                            ignore getNeuronData( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetNeuronInfoResponse({neuronId;}) );
                            let _ = pendingActionsMap.remove("getFullNeuronResponse_"#Nat64.toText(neuronId));
                            activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: getFullNeuronResponse_"#Nat64.toText(neuronId));
                        }; 
                        case(#Err(e)){ 
                            activityLogsMap.put(Int.toText(Time.now()),"Failed to complete action: Received an Error when trying to retreive neuron data. Error: "#e.error_message);
                            Debug.trap("Received an Error when trying to retreive full neuron info"); 
                        };
                    };
                };
                case(#GetNeuronInfoResponse({response; neuronId;})){
                    switch(response){
                        case(#Ok(neuronInfo)){
                            switch(neuronDataMap.get(Nat64.toText(neuronId))){
                                case null { 
                                    activityLogsMap.put(Int.toText(Time.now()),"Failed to complete action: No neuron in neuronDataMap matches the following neuronId: "#Nat64.toText(neuronId));
                                    Debug.trap("No neuron in neuronDataMap"); 
                                };
                                case(?neuronData){
                                    neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuronInfo = ?neuronInfo});
                                    computeNeuronStakeInfosVotingPowers(neuronDataMap, usersStakesMap, Nat64.toText(neuronId));
                                    let _ = pendingActionsMap.remove("getNeuronInfoResponse_"#Nat64.toText(neuronId));
                                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: getNeuronInfoResponse_"#Nat64.toText(neuronId));
                                };
                            };
                        }; 
                        case(#Err(e)){ 
                            activityLogsMap.put(Int.toText(Time.now()),"Failed to complete action:  Received an Error when trying to retreive neuron meta data. Error: "#e.error_message);
                            Debug.trap("Received an Error when trying to retreive full neuron info"); 
                        };
                    };
                };
            };
            return result;
        } catch(e){
            let timerId = setTimer(#seconds(20), func (): async () {let result = await readRequestResponse(
                neuronDataMap,
                usersStakesMap,
                depositsMap,
                pendingActionsMap,
                activityLogsMap,
                memoToNeuronIdMap,
                updateTokenBalances,
                transformFn,
                {input with numberOfFailedAttempts = input.numberOfFailedAttempts + 1}
            )});
            activityLogsMap.put(Int.toText(Time.now()),"Failed to read response. Cause of error: " #Error.message(e)# ". Trying again in 20 seconds.");
            throw Error.reject("No request to read response for.");
        };
    };

    public func manageNeuron( 
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersStakesMap: TreasuryTypes.UserStakesMap,
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature,
        args: Governance.ManageNeuron
    ): async Result.Result<(), TreasuryTypes.Error> {
        
        let ?neuronId = args.id else {
            activityLogsMap.put(Int.toText(Time.now()), "No neuronId in request");
            Debug.trap("No neuronId in request");
        };
        let ?command = args.command else {
            activityLogsMap.put(Int.toText(Time.now()), "No command in request");
            Debug.trap("No command in request");
        };
        let {public_key} = await EcdsaHelperMethods.getPublicKey(null);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let selfAuthPrincipal = Principal.fromBlob(principalAsBlob);
        var args_ : Governance.ManageNeuron = args;
        
        let (expectedResponseType, pendingActionId) : (TreasuryTypes.ExpectedRequestResponses, Text) = switch(command){
            case(#Spawn(_)) { (#Spawn({neuronId = neuronId.id; }), "spawn_"#Nat64.toText(neuronId.id)); };
            case(#Split({amount_e8s; })) { (#Split({neuronId = neuronId.id; amount_e8s; }), "split_"#Nat64.toText(neuronId.id)); };
            case(#Follow(_)) { (#Follow({neuronId = neuronId.id; }), "follow_"#Nat64.toText(neuronId.id)); };
            case(#Configure(_)) { (#Configure({neuronId = neuronId.id; }), "configure_"#Nat64.toText(neuronId.id)); };
            case(#Disburse(_)) { (#Disburse({neuronId = neuronId.id;}), "disburse_"#Nat64.toText(neuronId.id)); };
            case(#ClaimOrRefresh(_)) { (#ClaimOrRefresh({neuronId = neuronId.id; }), "claimOrRefresh_"#Nat64.toText(neuronId.id));};
            case(#RegisterVote(_)) { (#RegisterVote({neuronId = neuronId.id; }), "registerVote_"#Nat64.toText(neuronId.id));};
            case(_) { return #err(#ActionNotSupported) };
        };
        let newPendingAction: TreasuryTypes.PendingAction = {
            args = ?args_;
            expectedResponseType;
            selfAuthPrincipal;
            public_key;
        };
        pendingActionsMap.put(pendingActionId, newPendingAction);
        activityLogsMap.put(Int.toText(Time.now()),"New Action Pending: "#pendingActionId);
        ignore resolvePendingActions( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn );
        return #ok(());
    };

    public func increaseNeuron(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersStakesMap: TreasuryTypes.UserStakesMap,
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature,
        {amount: Nat64; neuronId: Nat64; contributor: Principal}
    ) : async Result.Result<(), TreasuryTypes.Error>  {

        let ?{neuron; neuronInfo} = neuronDataMap.get(Nat64.toText(neuronId)) else Debug.trap("No neuron for neuronId");
        let {account} = neuron;
        
        try{ debitUserIcpDeposits( depositsMap, updateTokenBalances, {userPrincipal = contributor; amount = amount + txFee});} 
        catch(e){ return #err(#InsufficientFunds)};
        
        let txResult = await NeuronManager.transferIcpToNeuronWithSubaccount(amount, account);
        switch(txResult){
            case(#err(e)){ return #err(e)};
            case(#ok({public_key; selfAuthPrincipal})) { 
                ignore updateTokenBalances();
                creditUserNeuronStake( neuronDataMap, usersStakesMap, depositsMap, updateTokenBalances,{ userPrincipal = Principal.toText(contributor);  delta = amount; neuronId = Nat64.toText(neuronId); });
                let newPendingAction: TreasuryTypes.PendingAction = {
                    args = ?{ id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#Subaccount(account); };
                    expectedResponseType = #ClaimOrRefresh({neuronId});
                    selfAuthPrincipal;
                    public_key;
                };
                pendingActionsMap.put("claimOrRefresh_"#Nat64.toText(neuronId), newPendingAction);
                activityLogsMap.put(Int.toText(Time.now()),"New Action Pending: claimOrRefresh_"#Nat64.toText(neuronId));
                ignore resolvePendingActions( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn );
                return #ok(());
            };
        };
    };

    public func createNeuron(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersStakesMap: TreasuryTypes.UserStakesMap,
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature,
        {amount: Nat64; contributor: Principal; neuronMemo: Nat64}
    ) : async Result.Result<(), TreasuryTypes.Error>  {

        try{ debitUserIcpDeposits( depositsMap, updateTokenBalances, {userPrincipal = contributor; amount = amount + txFee});} 
        catch(e){ return #err(#InsufficientFunds)};

        let txResult = await NeuronManager.transferIcpToNeuronWithMemo(amount, neuronMemo);

        switch(txResult){
            case(#err(e)){ return #err(e)};
            case(#ok({public_key; selfAuthPrincipal})) { 
                ignore updateTokenBalances();
                let newNeuronIdPlaceholderKey : Text = Nat64.toText(neuronMemo)#PENDING_NEURON_SUFFIX;
                creditUserNeuronStake( neuronDataMap, usersStakesMap, depositsMap, updateTokenBalances,{ userPrincipal = Principal.toText(contributor);  delta = amount; neuronId = newNeuronIdPlaceholderKey; });
                let newPendingAction: TreasuryTypes.PendingAction = {
                    args = ?{ id = null; command = ?#ClaimOrRefresh( {by = ?#MemoAndController( {controller = ?selfAuthPrincipal; memo = neuronMemo} )} ); neuron_id_or_subaccount = null; };
                    expectedResponseType = #CreateNeuronResponse({memo = neuronMemo; newNeuronIdPlaceholderKey});
                    selfAuthPrincipal;
                    public_key;
                };
                pendingActionsMap.put("createNeuronResponse_"#Nat64.toText(neuronMemo), newPendingAction);
                activityLogsMap.put(Int.toText(Time.now()),"New Action Pending: createNeuronResponse_"#Nat64.toText(neuronMemo));
                ignore resolvePendingActions( neuronDataMap, usersStakesMap, depositsMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn );
                return #ok(());
            };
        };
    };

    public func resolvePendingActions(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersStakesMap: TreasuryTypes.UserStakesMap,
        depositsMap: TreasuryTypes.TreasuryDepositsMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature
    ): async () {

        func resolvePendingActions_(actionId: Text, action: TreasuryTypes.PendingAction): async (){
            activityLogsMap.put(Int.toText(Time.now()),"Resolving pending action: "#actionId#", making HTTPS request to NNS governance canister.");
            let {args; expectedResponseType; selfAuthPrincipal; public_key;} = action;
            switch(expectedResponseType){
                case(#GetFullNeuronResponse({neuronId;})){
                    let {response; requestId; ingress_expiry;} = await NeuronManager.getNeuronData(neuronId, transformFn, #GetFullNeuronResponse({neuronId}));
                    if(response.status != 202) { 
                        activityLogsMap.put(Int.toText(Time.now()),"Action failed. HTTPS status returned is NOT 202");
                        throw Error.reject("Status not 202")
                    };
                    let readRequestResponseInput = {
                        requestId; 
                        expiry = ingress_expiry; 
                        expectedResponseType = #GetFullNeuronResponse({neuronId;});
                        numberOfFailedAttempts = 0;
                    };
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(
                        neuronDataMap,
                        usersStakesMap,
                        depositsMap,
                        pendingActionsMap,
                        activityLogsMap,
                        memoToNeuronIdMap,
                        updateTokenBalances,
                        transformFn,
                        readRequestResponseInput
                    ) });
                };
                case(#GetNeuronInfoResponse({neuronId;})){
                    let {response; requestId; ingress_expiry;} = await NeuronManager.getNeuronData(neuronId, transformFn, #GetNeuronInfoResponse({neuronId}));
                    if(response.status != 202) { 
                        activityLogsMap.put(Int.toText(Time.now()),"Action failed. HTTPS status returned is NOT 202");
                        throw Error.reject("Status not 202");
                    };
                    let readRequestResponseInput = {
                        requestId; 
                        expiry = ingress_expiry; 
                        expectedResponseType = #GetNeuronInfoResponse({neuronId;});
                        numberOfFailedAttempts = 0;
                    };
                    let timerId = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(
                        neuronDataMap,
                        usersStakesMap,
                        depositsMap,
                        pendingActionsMap,
                        activityLogsMap,
                        memoToNeuronIdMap,
                        updateTokenBalances,
                        transformFn,
                        readRequestResponseInput
                    )});
                };
                case(_){
                    let ?args_ = args else{ activityLogsMap.put(Int.toText(Time.now()),"Action Failed: no arguments provided for in action"); Debug.trap("No args in action"); };
                    let {response; requestId; ingress_expiry} = await NeuronManager.manageNeuron( args_, selfAuthPrincipal, public_key, transformFn );
                    if(response.status != 202) { 
                        activityLogsMap.put(Int.toText(Time.now()),"Action failed. HTTPS status returned is NOT 202"); 
                        throw Error.reject("Status not 202")
                    };
                    let readRequestResponseInput = {
                        requestId; 
                        expiry = ingress_expiry; 
                        expectedResponseType;
                        numberOfFailedAttempts = 0;
                    };
                    let timerId_1 = setTimer(#seconds(10), func (): async () {let result = await readRequestResponse(
                        neuronDataMap,
                        usersStakesMap,
                        depositsMap,
                        pendingActionsMap,
                        activityLogsMap,
                        memoToNeuronIdMap,
                        updateTokenBalances,
                        transformFn,
                        readRequestResponseInput
                    )});
                };
            };
        };

        let pendingActionsArray = Iter.toArray(pendingActionsMap.entries());
        var index = 0;
        let length = Array.size(pendingActionsArray);
        while(index < length){
            let (identifier, action) = pendingActionsArray[index];
            ignore resolvePendingActions_(identifier, action);
            index += 1;
        };
    };
};