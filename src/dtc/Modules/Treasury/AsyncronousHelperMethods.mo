import TreasuryTypes "../../Types/Treasury/types";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import Error "mo:base/Error";
import NeuronManager "../HTTPRequests/NeuronManager";
import Governance "../../NNS/Governance";
import EcdsaHelperMethods "../ECDSA/ECDSAHelperMethods";
import Account "../../Serializers/Account";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Time "mo:base/Time";
import SyncronousHelperMethods "SyncronousHelperMethods";

module{

    let {setTimer} = Timer;

    let txFee: Nat64 = 10_000;

    public let PENDING_NEURON_SUFFIX = "_pendingNeuron";

    public func refreshNeuronsData(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature
    ) : async () {


        let {public_key} = await EcdsaHelperMethods.getPublicKey(null);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(public_key);
        let selfAuthPrincipal = Principal.fromBlob(principalAsBlob);

        label populatePendingActionsLoop for((_, neuronData) in neuronDataMap.entries()){
            let ?neuron = neuronData.neuron else continue populatePendingActionsLoop;
            let {account;} = neuron;
            let ?neuronId = neuron.id else continue populatePendingActionsLoop;

            let newPendingAction: TreasuryTypes.PendingAction = {
                args = ?{ id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#Subaccount(account); };
                expectedResponseType = #ClaimOrRefresh({neuronId = neuronId.id; });
                selfAuthPrincipal;
                public_key;
            };
            pendingActionsMap.put("claimOrRefresh_"#Nat64.toText(neuronId.id), newPendingAction);
        };

        ignore resolvePendingActions( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn );
    };

    public func getNeuronData(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
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
        ignore resolvePendingActions(neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn);
    };

    public func readRequestResponse(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
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
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap,  memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId = neuronId.id;}));
                    SyncronousHelperMethods.finalizeNewlyCreatedNeuronStakeInfo(newNeuronIdPlaceholderKey, neuronId.id, neuronDataMap, usersTreasuryDataMap);
                    let _ = pendingActionsMap.remove("createNeuronResponse_"#Nat64.toText(memo));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: createNeuronResponse_"#Nat64.toText(memo));
                };
                case(#ClaimOrRefresh({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    let _ = pendingActionsMap.remove("claimOrRefresh_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: claimOrRefresh_"#Nat64.toText(neuronId));
                };
                case(#Spawn({response; neuronId;})){
                    let ?created_neuron_id = response.created_neuron_id else{
                        activityLogsMap.put(Int.toText(Time.now()),"Failed to complete action: No new created_neuron_id in response");
                        Debug.trap("No new created_neuron_id in response"); 
                    };
                    let ?parentNeuron = neuronDataMap.get(Nat64.toText(neuronId)) else {
                        activityLogsMap.put(Int.toText(Time.now()),"Failed to complete action: No parentNeuronContributions were recorded for newly spawned neuron");
                        neuronDataMap.put(Nat64.toText(created_neuron_id.id), {neuron = null; neuronInfo = null; parentNeuronContributions = null; contributions = []; });
                        Debug.trap("No parent neuron in neuronDataMap");
                    };
                    let parentNeuronContributions = ?parentNeuron.contributions;
                    neuronDataMap.put(Nat64.toText(created_neuron_id.id), {neuron = null; neuronInfo = null; parentNeuronContributions; contributions = []; });
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap ,memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId = created_neuron_id.id;}) );
                    let _ = pendingActionsMap.remove("spawn_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: spawn_"#Nat64.toText(neuronId));
                };
                case(#Split({response; neuronId; amount_e8s; proposer;})){
                    let ?created_neuron_id = response.created_neuron_id else {
                        activityLogsMap.put(Int.toText(Time.now()),"Failed to complete action: No new created_neuron_id in response");
                        Debug.trap("No new created_neuron_id in response");
                    };
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId = created_neuron_id.id;}));
                    SyncronousHelperMethods.splitNeuronStakeInfo(neuronId, created_neuron_id.id,amount_e8s, Principal.toText(proposer), usersTreasuryDataMap, neuronDataMap);
                    let _ = pendingActionsMap.remove("split_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: split_"#Nat64.toText(neuronId));
                };
                case(#Follow({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    let _ = pendingActionsMap.remove("follow_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: follow_"#Nat64.toText(neuronId));
                };
                case(#Configure({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
                    let _ = pendingActionsMap.remove("configure_"#Nat64.toText(neuronId));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: configure_"#Nat64.toText(neuronId));
                };
                case(#Disburse({response; neuronId; proposer;})){
                    let _ = pendingActionsMap.remove("disburse_"#Nat64.toText(neuronId));
                    SyncronousHelperMethods.creditUsersForDispursedNeuron(neuronDataMap, usersTreasuryDataMap, updateTokenBalances, Nat64.toText(neuronId), Principal.toText(proposer));
                    activityLogsMap.put(Int.toText(Time.now()),"successfully completed action: disburse_"#Nat64.toText(neuronId));
                };
                case(#RegisterVote({response; neuronId;})){
                    ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetFullNeuronResponse({neuronId;}) );
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
                                case null { 
                                    activityLogsMap.put(Int.toText(Time.now()),"No contributions made to neuron " #Nat64.toText(neuronId));
                                    Debug.trap("No contributions made to neuron " #Nat64.toText(neuronId)); 
                                };
                                case(?neuronData){ neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuron = ?neuron }); };
                            };
                            ignore getNeuronData( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn, #GetNeuronInfoResponse({neuronId;}) );
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
                                    SyncronousHelperMethods.computeNeuronStakeInfosVotingPowers(neuronDataMap, Nat64.toText(neuronId));
                                    if(neuronData.contributions.size() == 0) SyncronousHelperMethods.allocateNewlySpawnedNeuronStakes(neuronDataMap, Nat64.toText(neuronId));
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
                usersTreasuryDataMap,
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
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature,
        args: Governance.ManageNeuron,
        proposer: Principal
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
        
        let (expectedResponseType, pendingActionId) : (TreasuryTypes.ExpectedRequestResponses, Text) = switch(command){
            case(#Spawn(_)) { 
                let proposerNeuronStake = SyncronousHelperMethods.getUserNeuronStakeInfo(Principal.toText(proposer), neuronDataMap, Nat64.toText(neuronId.id));
                if(proposerNeuronStake.stake_e8s < txFee) { 
                    activityLogsMap.put(Int.toText(Time.now()), "Proposer has insufficient stake to cover transaction fee.");
                    return #err(#InsufficientFunds);
                };
                (#Spawn({neuronId = neuronId.id; }), "spawn_"#Nat64.toText(neuronId.id)); 
            };
            case(#Split({amount_e8s; })) { 
                let proposerNeuronStake = SyncronousHelperMethods.getUserNeuronStakeInfo(Principal.toText(proposer), neuronDataMap, Nat64.toText(neuronId.id));
                if(proposerNeuronStake.stake_e8s < txFee) { 
                    activityLogsMap.put(Int.toText(Time.now()), "Proposer has insufficient stake to cover transaction fee.");
                    return #err(#InsufficientFunds);
                };
                (#Split({neuronId = neuronId.id; amount_e8s; proposer;}), "split_"#Nat64.toText(neuronId.id)); 
            };
            case(#Follow(_)) { (#Follow({neuronId = neuronId.id; }), "follow_"#Nat64.toText(neuronId.id)); };
            case(#Configure(_)) { (#Configure({neuronId = neuronId.id; }), "configure_"#Nat64.toText(neuronId.id)); };
            case(#Disburse(_)) {
                let proposerNeuronStake = SyncronousHelperMethods.getUserNeuronStakeInfo(Principal.toText(proposer), neuronDataMap, Nat64.toText(neuronId.id));
                if(proposerNeuronStake.stake_e8s < txFee) { 
                    activityLogsMap.put(Int.toText(Time.now()), "Proposer has insufficient stake to cover transaction fee.");
                    return #err(#InsufficientFunds);
                };
                (#Disburse({neuronId = neuronId.id; proposer}), "disburse_"#Nat64.toText(neuronId.id)); 
            };
            case(#ClaimOrRefresh(_)) { (#ClaimOrRefresh({neuronId = neuronId.id; }), "claimOrRefresh_"#Nat64.toText(neuronId.id));};
            case(#RegisterVote(_)) { (#RegisterVote({neuronId = neuronId.id; }), "registerVote_"#Nat64.toText(neuronId.id));};
            case(_) { return #err(#ActionNotSupported) };
        };
        let newPendingAction: TreasuryTypes.PendingAction = {
            args = ?args;
            expectedResponseType;
            selfAuthPrincipal;
            public_key;
        };
        pendingActionsMap.put(pendingActionId, newPendingAction);
        activityLogsMap.put(Int.toText(Time.now()),"New Action Pending: "#pendingActionId);
        ignore resolvePendingActions( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn );
        return #ok(());
    };

    public func increaseNeuron(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature,
        {amount: Nat64; neuronId: Nat64; contributor: Principal}
    ) : async Result.Result<(), TreasuryTypes.Error>  {

        let ?neuronData = neuronDataMap.get(Nat64.toText(neuronId)) else Debug.trap("No neuron data for neuronId");
        let ?neuron = neuronData.neuron else Debug.trap("No neuron for neuronId");
        let {account} = neuron;
        
        try{ SyncronousHelperMethods.debitUserIcpDeposits( usersTreasuryDataMap, updateTokenBalances, {userPrincipal = Principal.toText(contributor); amount = amount + txFee});} 
        catch(e){ return #err(#InsufficientFunds)};
        
        let txResult = await NeuronManager.transferIcpToNeuronWithSubaccount(amount, account);
        switch(txResult){
            case(#err(e)){ return #err(e)};
            case(#ok({public_key; selfAuthPrincipal})) { 
                ignore updateTokenBalances();
                SyncronousHelperMethods.creditUserNeuronStake( neuronDataMap, usersTreasuryDataMap, updateTokenBalances,{ userPrincipal = Principal.toText(contributor);  delta = amount; neuronId = Nat64.toText(neuronId); });
                let newPendingAction: TreasuryTypes.PendingAction = {
                    args = ?{ id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#Subaccount(account); };
                    expectedResponseType = #ClaimOrRefresh({neuronId});
                    selfAuthPrincipal;
                    public_key;
                };
                pendingActionsMap.put("claimOrRefresh_"#Nat64.toText(neuronId), newPendingAction);
                activityLogsMap.put(Int.toText(Time.now()),"New Action Pending: claimOrRefresh_"#Nat64.toText(neuronId));
                ignore resolvePendingActions( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn );
                return #ok(());
            };
        };
    };

    public func createNeuron(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        activityLogsMap: TreasuryTypes.ActionLogsMap,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared () -> async (),
        transformFn: NeuronManager.TransformFnSignature,
        {amount: Nat64; contributor: Principal; neuronMemo: Nat64}
    ) : async Result.Result<(), TreasuryTypes.Error>  {

        try{ SyncronousHelperMethods.debitUserIcpDeposits( usersTreasuryDataMap, updateTokenBalances, {userPrincipal = Principal.toText(contributor); amount = amount + txFee});} 
        catch(e){ return #err(#InsufficientFunds)};

        let txResult = await NeuronManager.transferIcpToNeuronWithMemo(amount, neuronMemo);

        switch(txResult){
            case(#err(e)){ return #err(e)};
            case(#ok({public_key; selfAuthPrincipal})) { 
                ignore updateTokenBalances();
                let newNeuronIdPlaceholderKey : Text = Nat64.toText(neuronMemo)#PENDING_NEURON_SUFFIX;
                SyncronousHelperMethods.creditUserNeuronStake( neuronDataMap, usersTreasuryDataMap, updateTokenBalances,{ userPrincipal = Principal.toText(contributor);  delta = amount; neuronId = newNeuronIdPlaceholderKey; });
                let newPendingAction: TreasuryTypes.PendingAction = {
                    args = ?{ id = null; command = ?#ClaimOrRefresh( {by = ?#MemoAndController( {controller = ?selfAuthPrincipal; memo = neuronMemo} )} ); neuron_id_or_subaccount = null; };
                    expectedResponseType = #CreateNeuronResponse({memo = neuronMemo; newNeuronIdPlaceholderKey});
                    selfAuthPrincipal;
                    public_key;
                };
                pendingActionsMap.put("createNeuronResponse_"#Nat64.toText(neuronMemo), newPendingAction);
                activityLogsMap.put(Int.toText(Time.now()),"New Action Pending: createNeuronResponse_"#Nat64.toText(neuronMemo));
                ignore resolvePendingActions( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, activityLogsMap, memoToNeuronIdMap, updateTokenBalances, transformFn );
                return #ok(());
            };
        };
    };

    public func resolvePendingActions(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
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
                        usersTreasuryDataMap,
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
                        usersTreasuryDataMap,
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
                        usersTreasuryDataMap,
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