import TreasuryTypes "../../Types/Treasury/types";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Governance "../../NNS/Governance"; 
import Array "mo:base/Array";
import Int "mo:base/Int";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Blob "mo:base/Blob";
import SyncronousHelperMethods "SyncronousHelperMethods";
import Ledger "../../NNS/Ledger";
import Account "../../Serializers/Account";
import NatX "../../MotokoNumbers/NatX";

module{

    let txFee: Nat64 = 10_000;

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public let PENDING_NEURON_SUFFIX = "_pendingNeuron";

    public func manageNeuron( 
        neuronDataMap: TreasuryTypes.NeuronsDataMap, 
        args: Governance.ManageNeuron,
        neuronContributionsForNewlyCreatedNeuron: TreasuryTypes.NeuronContributions
    ): async (Governance.ManageNeuronResponse, ?TreasuryTypes.NeuronContributions) {
        
        let governanceCanister: Governance.Interface = actor(Governance.CANISTER_ID);
        let ?command = args.command else { throw Error.reject("No command in request"); };
        let (args_, neuronContributions): (Governance.ManageNeuron, ?TreasuryTypes.NeuronContributions) = switch(args.id){
            case null {
                switch(command){
                    case(#ClaimOrRefresh({by})){ 
                        let ?by_ = by else { throw Error.reject("NeuronId and MemoAndController missing from args") };
                        switch(by_){ 
                            case(#MemoAndController(_)){ (args, ?neuronContributionsForNewlyCreatedNeuron) };
                            case(_){ throw Error.reject("NeuronId and MemoAndController missing from args") };
                        };
                    };
                    case(_){ throw Error.reject("NeuronId missing from args") };
                }
            };
            case(?neuronId){
                let ?{contributions; proxyNeuron} = neuronDataMap.get(Nat64.toText(neuronId.id)) else Debug.trap("No neuron data for neuronId");
                let parentNeuronContributions: ?TreasuryTypes.NeuronContributions = switch(command){
                    case(#Disburse(_)) {
                        if(SyncronousHelperMethods.isProxyOrHasAProxyNeuron(neuronId.id, neuronDataMap)) { throw Error.reject("Neuron is or has a proxy neuron. Cannot disburse such neurons.") };
                        label isCollateralized for((userPrincipal, {collateralized_stake_e8s}) in Iter.fromArray(contributions)){
                            let ?collateral = collateralized_stake_e8s else continue isCollateralized;
                            if(collateral > 0) { throw Error.reject("Neuron is collateralized. Cannot disburse from collateralized neuron.") };
                        };
                        null
                    };       
                    case(#Spawn(_)){ ?contributions; };
                    case(#ClaimOrRefresh(_)){null};
                    case(#Follow({topic})){ if(topic == 1){ throw Error.reject("No followee may be selected for this particular topic.") }; null};
                    case(#Configure({operation})){
                        switch(operation){
                            case(?#StartDissolving(_)){ 
                                if(SyncronousHelperMethods.isProxyOrHasAProxyNeuron(neuronId.id, neuronDataMap)) { throw Error.reject("Neuron is or has a proxy neuron. Cannot disburse such neurons.") };
                            };
                            case(_){};
                        }; null;
                    };
                    case(#Split(_)) { throw Error.reject("Action: 'Split' is unsupported") };
                    case(#DisburseToNeuron(_)) { throw Error.reject("Action: 'DisburseToNeuron' is unsupported") };
                    case(#RegisterVote(_)) { throw Error.reject("Action: 'RegisterVote' is unsupported") };
                    case(#StakeMaturity(_)) { throw Error.reject("Action: 'StakeMaturity' is unsupported") };
                    case(#MergeMaturity(_)) { throw Error.reject("Action: 'MergeMaturity' is unsupported") };
                    case(#Merge(_)) { throw Error.reject("Action: 'Merge' is unsupported") };
                    case(#MakeProposal(_)) { throw Error.reject("Action: 'MakeProposal' is unsupported") };
                };
                switch(proxyNeuron){
                    case null{ (args, parentNeuronContributions) };
                    case(?proxyNeuron){
                        let ?proxyNeuronIdAsNat = Nat.fromText(proxyNeuron) else { throw Error.reject("Invalid proxyNeuron") };
                        let proxyArgs = SyncronousHelperMethods.wrapArgsToProxiedNeuron(args, Nat64.fromNat(proxyNeuronIdAsNat));
                        (proxyArgs, parentNeuronContributions);
                    };
                };
            };
        }; 
        return (await governanceCanister.manage_neuron(args_), neuronContributions);
    };

    // public func manageNeuron( 
    //     neuronDataMap: TreasuryTypes.NeuronsDataMap,
    //     usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
    //     pendingActionsMap: TreasuryTypes.PendingActionsMap,
    //     actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
    //     memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
    //     updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
    //     fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
    //     transformFn: NeuronManager.TransformFnSignature,
    //     args: Governance.ManageNeuron,
    //     proposer: ?Principal,
    //     treasuryCanisterId: ?Principal,
    //     selfAuthPrincipal: Principal,
    //     publicKey: Blob
    // ): async Result.Result<(), TreasuryTypes.Error> {
        
    //     let ?neuronId = args.id else {
    //         actionLogsArrayBuffer.add(Int.toText(Time.now()), "No neuronId in request");
    //         Debug.trap("No neuronId in request");
    //     };
    //     let ?command = args.command else {
    //         actionLogsArrayBuffer.add(Int.toText(Time.now()), "No command in request");
    //         Debug.trap("No command in request");
    //     };

    //     let pendingActionId : Text = switch(command){
    //         case(#Spawn(_)) { "spawn_"#Nat64.toText(neuronId.id); };
    //         case(#Follow(_)) { "follow_"#Nat64.toText(neuronId.id); };
    //         case(#Configure(_)) { "configure_"#Nat64.toText(neuronId.id); };
    //         case(#Disburse(_)) { 
    //             let ?{contributions} = neuronDataMap.get(Nat64.toText(neuronId.id)) else { throw Error.reject("No neuron found") };
    //             label isCollateralized for((userPrincipal, {collateralized_stake_e8s }) in Iter.fromArray(contributions)){
    //                 let ?collateral = collateralized_stake_e8s else continue isCollateralized;
    //                 if(collateral > 0) { throw Error.reject("Neuron is collateralized. Cannot disburse from collateralized neuron.") };
    //             };
    //             "disburse_"#Nat64.toText(neuronId.id); 
    //         };
    //         case(#ClaimOrRefresh(_)) { "claimOrRefresh_"#Nat64.toText(neuronId.id);};
    //         case(_) { return #err(#ActionNotSupported) };
    //     };
    //     let newPendingAction: TreasuryTypes.PendingAction = {
    //         expectedHttpResponseType = ?#GovernanceManageNeuronResponse({neuronId = ?neuronId.id; memo = null; proposer; treasuryCanisterId; });
    //         function = #ManageNeuron({  input = {args; selfAuthPrincipal; public_key = publicKey; transformFn;} });
    //     };
    //     pendingActionsMap.put(pendingActionId, newPendingAction);
    //     actionLogsArrayBuffer.add(Int.toText(Time.now()),"New Action Pending: "#pendingActionId);
    //     ignore resolvePendingActionFromQueue( 
    //         neuronDataMap, 
    //         usersTreasuryDataMap, 
    //         pendingActionsMap, 
    //         actionLogsArrayBuffer, 
    //         memoToNeuronIdMap, 
    //         updateTokenBalances,
    //         fundingCampaignsMap, 
    //         transformFn
    //     );
    //     return #ok(());
    // };

    // public func increaseNeuron(
    //     neuronDataMap: TreasuryTypes.NeuronsDataMap,
    //     usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
    //     pendingActionsMap: TreasuryTypes.PendingActionsMap,
    //     actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
    //     memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
    //     updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
    //     fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
    //     transformFn: NeuronManager.TransformFnSignature,
    //     {amount: Nat64; neuronId: Nat64; contributor: Principal; selfAuthPrincipal: Principal; publicKey: Blob}
    // ) : async Result.Result<({amountSent: Nat64}), TreasuryTypes.Error>  {

    //     let ?neuronData = neuronDataMap.get(Nat64.toText(neuronId)) else Debug.trap("No neuron data for neuronId");
    //     let ?neuron = neuronData.neuron else Debug.trap("No neuron for neuronId");
    //     let {account = neuronSubaccount} = neuron;
    //     let ?{subaccountId} = usersTreasuryDataMap.get(Principal.toText(contributor)) else Debug.trap("No subaccount for contributor");
    //     let {amountSent} = await NeuronManager.transferIcpToNeuron(amount, #NeuronSubaccountId(neuronSubaccount), subaccountId, selfAuthPrincipal);
    //     ignore updateTokenBalances(#Principal(Principal.toText(contributor)), #Icp, #UserTreasuryData);
    //     SyncronousHelperMethods.updateUserNeuronContribution( neuronDataMap,{ userPrincipal = Principal.toText(contributor);  delta = amountSent; neuronId = Nat64.toText(neuronId); operation = #AddStake; });
    //     let args = { id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#Subaccount(neuronSubaccount); };
    //     let newPendingAction: TreasuryTypes.PendingAction = {
    //         expectedHttpResponseType = ?#GovernanceManageNeuronResponse({neuronId = ?neuronId; memo = null; proposer = null; treasuryCanisterId = null; });
    //         function = #ManageNeuron({ input = { args; selfAuthPrincipal; public_key = publicKey; transformFn; method_name = TreasuryTypes.GetNeuronDataMethodNames.getFullNeuron }; });
    //     };
        
    //     pendingActionsMap.put("claimOrRefresh_"#Nat64.toText(neuronId), newPendingAction);
    //     actionLogsArrayBuffer.add(Int.toText(Time.now()),"New Action Pending: claimOrRefresh_"#Nat64.toText(neuronId));
    //     ignore resolvePendingActionFromQueue( 
    //         neuronDataMap, 
    //         usersTreasuryDataMap, 
    //         pendingActionsMap, 
    //         actionLogsArrayBuffer, 
    //         memoToNeuronIdMap, 
    //         updateTokenBalances,
    //         fundingCampaignsMap, 
    //         transformFn
    //     );
    //     return #ok({amountSent});
    // };

    // public func createNeuron(
    //     neuronDataMap: TreasuryTypes.NeuronsDataMap,
    //     usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
    //     pendingActionsMap: TreasuryTypes.PendingActionsMap,
    //     actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
    //     memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
    //     updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
    //     fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
    //     transformFn: NeuronManager.TransformFnSignature,
    //     {amount: Nat64; contributor: Principal; neuronMemo: Nat64; selfAuthPrincipal: Principal; publicKey: Blob}
    // ) : async Result.Result<({amountSent: Nat64}), TreasuryTypes.Error>  {

    //     let ?{subaccountId} = usersTreasuryDataMap.get(Principal.toText(contributor)) else Debug.trap("No subaccount for contributor");
    //     let {amountSent} = await NeuronManager.transferIcpToNeuron(amount, #Memo(neuronMemo), subaccountId, selfAuthPrincipal);
    //     ignore updateTokenBalances(#Principal(Principal.toText(contributor)), #Icp, #UserTreasuryData);
    //     let newNeuronIdPlaceholderKey : Text = Nat64.toText(neuronMemo)#PENDING_NEURON_SUFFIX;
    //     SyncronousHelperMethods.updateUserNeuronContribution( neuronDataMap,{ userPrincipal = Principal.toText(contributor);  delta = amountSent; neuronId = newNeuronIdPlaceholderKey; operation = #AddStake;});
    //     let args = { id = null; command = ?#ClaimOrRefresh( {by = ?#MemoAndController( {controller = ?selfAuthPrincipal; memo = neuronMemo} )} ); neuron_id_or_subaccount = null; };
    //     let newPendingAction: TreasuryTypes.PendingAction = {
    //         expectedHttpResponseType = ?#GovernanceManageNeuronResponse({neuronId = null; memo = ?neuronMemo; proposer = null; treasuryCanisterId = null; });
    //         function = #ManageNeuron({ input = {args; selfAuthPrincipal; public_key = publicKey; transformFn;} });
    //     };
    //     pendingActionsMap.put("createNeuronResponse_"#Nat64.toText(neuronMemo), newPendingAction);
    //     actionLogsArrayBuffer.add(Int.toText(Time.now()),"New Action Pending: createNeuronResponse_"#Nat64.toText(neuronMemo));
    //     ignore resolvePendingActionFromQueue( 
    //         neuronDataMap, 
    //         usersTreasuryDataMap, 
    //         pendingActionsMap, 
    //         actionLogsArrayBuffer, 
    //         memoToNeuronIdMap, 
    //         updateTokenBalances, 
    //         fundingCampaignsMap,
    //         transformFn
    //     );
    //     return #ok({amountSent});
        
    // };

    // public func refreshNeuronsData(
    //     neuronDataMap: TreasuryTypes.NeuronsDataMap,
    //     usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
    //     pendingActionsMap: TreasuryTypes.PendingActionsMap,
    //     actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
    //     memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
    //     updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
    //     fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
    //     transformFn: NeuronManager.TransformFnSignature,
    //     selfAuthPrincipal: Principal,
    //     publicKey: Blob
    // ) : async () {

    //     label populatePendingActionsLoop for((_, neuronData) in neuronDataMap.entries()){
    //         let ?neuron = neuronData.neuron else continue populatePendingActionsLoop;
    //         let ?neuronId = neuron.id else continue populatePendingActionsLoop;
    //         let args = { id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#NeuronId(neuronId); };
    //         let newPendingAction: TreasuryTypes.PendingAction = {
    //             expectedHttpResponseType = ?#GovernanceManageNeuronResponse({neuronId = ?neuronId.id; memo = null; proposer = null; treasuryCanisterId = null; });
    //             function = #ManageNeuron({ input = {args; selfAuthPrincipal; public_key = publicKey; transformFn;} });
    //         };                
    //         pendingActionsMap.put("claimOrRefresh_"#Nat64.toText(neuronId.id), newPendingAction);
    //     };

    //     ignore resolvePendingActionFromQueue( 
    //         neuronDataMap, 
    //         usersTreasuryDataMap, 
    //         pendingActionsMap, 
    //         actionLogsArrayBuffer, 
    //         memoToNeuronIdMap, 
    //         updateTokenBalances, 
    //         fundingCampaignsMap,
    //         transformFn
    //     );
    // };

    // public func resolvePendingActionFromQueue(
    //     neuronDataMap: TreasuryTypes.NeuronsDataMap,
    //     usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
    //     pendingActionsMap: TreasuryTypes.PendingActionsMap,
    //     actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
    //     memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
    //     updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType ) -> async (),
    //     fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
    //     transformFn: NeuronManager.TransformFnSignature
    // ): async () {

    //     func resolvePendingAction_(identifier: Text, action: TreasuryTypes.PendingAction): async () {
    //         try{
    //             actionLogsArrayBuffer.add(Int.toText(Time.now()),"Resolving pending action: "#identifier#", making HTTPS request to NNS governance canister.");
    //             let ({response; requestId; ingress_expiry;}, selfAuthPrincipal, publicKey) = switch(action.function){
    //                 case (#ManageNeuron({input;})) { (await NeuronManager.manageNeuron(input),input.selfAuthPrincipal, input.public_key ); };
    //                 case (#GetNeuronData({input;})){ (await NeuronManager.getNeuronData(input), input.selfAuthPrincipal, input.public_key); };
    //             };
    //             if(response.status != 202) { actionLogsArrayBuffer.add(Int.toText(Time.now()),"Action failed. HTTPS status returned is NOT 202"); throw Error.reject("Action failed. HTTPS status returned is NOT 202"); };
    //             let ?expectedResponseType = action.expectedHttpResponseType else { throw Error.reject("No expected response type for action: "#identifier); };
    //             let readRequestResponseInput = {response; requestId; expiry = ingress_expiry; expectedResponseType;};
    //             let failedAttempts: Nat = 0;
    //             actionLogsArrayBuffer.add(Int.toText(Time.now()),"RequestID received for: "#identifier#". Reading Response From NNS Governance Canister.");
    //             let readRequestResponseOutput = await NeuronManager.readRequestResponse(readRequestResponseInput, selfAuthPrincipal, publicKey, transformFn, failedAttempts);
    //             let processResponseInput: TreasuryTypes.ProcessResponseInput = {readRequestResponseOutput; neuronDataMap; usersTreasuryDataMap; pendingActionsMap; actionLogsArrayBuffer; memoToNeuronIdMap; updateTokenBalances; selfAuthPrincipal; publicKey; transformFn; identifier; fundingCampaignsMap};
    //             ignore pendingActionsMap.remove(identifier);
    //             actionLogsArrayBuffer.add(Int.toText(Time.now()),"Processing Response for: "#identifier);
    //             let {newPendingAction} = try { await processResponse(processResponseInput); }
    //             catch(e){ actionLogsArrayBuffer.add(Int.toText(Time.now()),"Failed to process response for: "#identifier#". Error: "#Error.message(e)); return; };
    //             actionLogsArrayBuffer.add(Int.toText(Time.now()),"Processing completed for response: "#identifier);
    //             if(newPendingAction) ignore resolvePendingActionFromQueue( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, actionLogsArrayBuffer, memoToNeuronIdMap, updateTokenBalances,fundingCampaignsMap, transformFn);
    //         } catch(e){ actionLogsArrayBuffer.add(Int.toText(Time.now()),"Failed to resolve pending action: "#identifier#". Cause of error: " #Error.message(e)); };
    //     };

    //     let pendingActionsArray = Iter.toArray(pendingActionsMap.entries());
    //     let length = Array.size(pendingActionsArray);
    //     if(length == 0) throw Error.reject("No pending actions to resolve");
    //     var index = 0;
    //     label loop_ while(index < length){
    //         let (identifier, action) = pendingActionsArray[index];
    //         ignore resolvePendingAction_(identifier, action); 
    //         index += 1;
    //     };


    // };

    // public func processResponse({
    //     neuronDataMap: TreasuryTypes.NeuronsDataMap;
    //     usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
    //     pendingActionsMap: TreasuryTypes.PendingActionsMap;
    //     actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer;
    //     memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap;
    //     updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ();
    //     fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
    //     readRequestResponseOutput: TreasuryTypes.ReadRequestResponseOutput;
    //     selfAuthPrincipal: Principal;
    //     publicKey: Blob;
    //     transformFn: TreasuryTypes.TransformFnSignature;
    // }): async {newPendingAction: Bool;} {

    //     func createPendingActionsToUpdateNeuronData(neuronId: Nat64){
    //         let newPendingAction: TreasuryTypes.PendingAction = {
    //                 expectedHttpResponseType = ?#GovernanceResult_2({neuronId});
    //                 function = #GetNeuronData({ input = {args = neuronId; selfAuthPrincipal; public_key = publicKey; transformFn; method_name = TreasuryTypes.GetNeuronDataMethodNames.getFullNeuron}; }); 
    //             };
    //         let newPendingAction2: TreasuryTypes.PendingAction = {
    //             expectedHttpResponseType = ?#GovernanceResult_5({neuronId});
    //             function = #GetNeuronData({ input = {args = neuronId; selfAuthPrincipal; public_key = publicKey; transformFn; method_name = TreasuryTypes.GetNeuronDataMethodNames.getNeuronInfo}; }); };
    //         pendingActionsMap.put("getFullNeuronResponse_"#Nat64.toText(neuronId), newPendingAction);
    //         pendingActionsMap.put("getNeuronInfoResponse_"#Nat64.toText(neuronId), newPendingAction2);
    //     };

    //     switch(readRequestResponseOutput){
    //         case(#ClaimOrRefresh({memo; neuronId})){
    //             if(memo != null){
    //                 let ?memo_ = memo else { throw Error.reject("No memo for newly created neuron") } ;
    //                 memoToNeuronIdMap.put(Nat64.toNat(memo_), neuronId);
    //                 SyncronousHelperMethods.finalizeNewlyCreatedNeuronData(Nat64.toText(memo_)#PENDING_NEURON_SUFFIX, neuronId, neuronDataMap);
    //             };
    //             createPendingActionsToUpdateNeuronData(neuronId);
    //             return {newPendingAction = true};
    //         };
    //         case(#Spawn({created_neuron_id; neuronId;})){
    //             neuronDataMap.put(Nat64.toText(created_neuron_id), {neuron = null; neuronInfo = null; parentNeuronContributions = null; contributions = []; proxyNeuron = null });

    //             let ?parentNeuron = neuronDataMap.get(Nat64.toText(neuronId)) else { throw Error.reject("no neuron found") };
    //             let parentNeuronContributions = ?parentNeuron.contributions;
    //             neuronDataMap.put(Nat64.toText(created_neuron_id), {neuron = null; neuronInfo = null; parentNeuronContributions; contributions = []; proxyNeuron = null});
    //             createPendingActionsToUpdateNeuronData(neuronId);
    //             createPendingActionsToUpdateNeuronData(created_neuron_id);
    //             return {newPendingAction = true};
    //         };
    //         case(#Follow({neuronId;})){
    //             createPendingActionsToUpdateNeuronData(neuronId);
    //             return {newPendingAction = true};
    //         };
    //         case(#Configure({neuronId;})){
    //             createPendingActionsToUpdateNeuronData(neuronId);
    //             return {newPendingAction = true};
    //         };
    //         case(#Disburse({neuronId; treasuryCanisterId})){
    //             await distributePayoutsFromNeuron( Nat64.toText(neuronId), usersTreasuryDataMap, updateTokenBalances, fundingCampaignsMap, neuronDataMap, treasuryCanisterId);
    //             ignore neuronDataMap.remove(Nat64.toText(neuronId));
    //             return {newPendingAction = false};
    //         };
    //         case(#Error({error_message;})){throw Error.reject(error_message) };
    //         case(#GovernanceResult_2({response; neuronId;})){
    //             switch(response){
    //                 case(#Ok(neuron)){
    //                     let ?neuronData = neuronDataMap.get(Nat64.toText(neuronId)) else { throw Error.reject("neuronData Not Found") };
    //                     neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuron = ?neuron }); 
    //                     return {newPendingAction = false};
    //                 }; 
    //                 case(#Err({error_message;})){ throw Error.reject(error_message) };
    //             };
    //         };
    //         case(#GovernanceResult_5({response; neuronId;})){
    //             switch(response){
    //                 case(#Ok(neuronInfo)){
    //                     switch(neuronDataMap.get(Nat64.toText(neuronId))){
    //                         case null { throw Error.reject("neuronInfo Not Found") };
    //                         case(?neuronData){
    //                             neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuronInfo = ?neuronInfo});
    //                             SyncronousHelperMethods.computeNeuronStakeInfosVotingPowers(neuronDataMap, Nat64.toText(neuronId));
    //                             if(neuronData.contributions.size() == 0) SyncronousHelperMethods.populateContributionsArrayFromParentNeuronContributions(neuronDataMap, Nat64.toText(neuronId));
    //                             {newPendingAction = false};
    //                         };
    //                     };
    //                 }; 
    //                 case(#Err({error_message})){ throw Error.reject(error_message) };
    //             };
    //         };
    //     };
    // };

    public func upateNeuronsDataMap( neuronDataMap: TreasuryTypes.NeuronsDataMap, neuronContributions: ?TreasuryTypes.NeuronContributions): 
    async () {

        let governanceCanister: Governance.Interface = actor(Governance.CANISTER_ID);
        let ownedNeurons = await governanceCanister.get_neuron_ids();

        let listNeuronsInput = { neuron_ids : [Nat64] = ownedNeurons; include_neurons_readable_by_caller : Bool = false; };
        let {neuron_infos; full_neurons} = await governanceCanister.list_neurons(listNeuronsInput);

        label updatingNeuronInfosAndAddingNewNeuronsToNeuronsDataMap for((neuronId, neuronInfo) in Iter.fromArray(neuron_infos) ){
            if(neuronInfo.stake_e8s == 0 and neuronInfo.state != TreasuryTypes.NEURON_STATES.spawning ) continue updatingNeuronInfosAndAddingNewNeuronsToNeuronsDataMap;
            switch(neuronDataMap.get(Nat64.toText(neuronId))){
                case null {
                    var parentNeuronContributions: ?TreasuryTypes.NeuronContributions = null;
                    var contributions: TreasuryTypes.NeuronContributions = [];
                    if(neuronInfo.state == TreasuryTypes.NEURON_STATES.spawning){ parentNeuronContributions := neuronContributions }
                    else { 
                        let ?contributions_ = neuronContributions else { throw Error.reject("No contributions for neuron") };
                        contributions := contributions_; 
                    };
                    let neuronData: TreasuryTypes.NeuronData = {neuron = null; neuronInfo = ?neuronInfo; parentNeuronContributions; contributions; proxyNeuron = null};
                    neuronDataMap.put(Nat64.toText(neuronId), neuronData);
                };
                case (?neuronData){ 
                    neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuronInfo = ?neuronInfo}); 
                    if(neuronData.contributions.size() == 0 and neuronInfo.state != TreasuryTypes.NEURON_STATES.spawning ){
                        SyncronousHelperMethods.populateContributionsArrayFromParentNeuronContributions(neuronDataMap, Nat64.toText(neuronId));
                    };
                };
            };
            SyncronousHelperMethods.computeNeuronStakeInfosVotingPowers(neuronDataMap, Nat64.toText(neuronId));
        };

        label updatingFullNeurons for(neuron in Iter.fromArray(full_neurons) ){
            let ?{id = neuronId} = neuron.id else continue updatingFullNeurons;
            let ?neuronData = neuronDataMap.get(Nat64.toText(neuronId)) else continue updatingFullNeurons;
            neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuron = ?neuron});
        };
    };

    public func distributePayoutsFromNeuron(
        neuronId: TreasuryTypes.NeuronIdAsText,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, 
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (), 
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        treasuryCanisterId: Principal,
    ): async () {
        
        func performUserPayoutFromNeuronDisbursal(userPrincipal: Principal, amountOwedToUser: Nat64) : async () {
            let ?{subaccountId = userSubaccountId} = usersTreasuryDataMap.get(Principal.toText(userPrincipal)) else { return };
            ignore await performTransfer(amountOwedToUser, {subaccountId = null; accountType = #MultiSigAccount}, {owner = treasuryCanisterId; subaccountId = ?userSubaccountId; accountType = #UserTreasuryData }, updateTokenBalances);
        };

        let ?{contributions; neuronInfo} = neuronDataMap.get(neuronId) else { throw Error.reject("No neuron found") };
        let ?neuronInfo_ = neuronInfo else { throw Error.reject("No neuronInfo found") };
        var totalAmountContributedToNeuron: Nat64 = 0;
        for((_, {stake_e8s = userContribution }) in Iter.fromArray(contributions)){ totalAmountContributedToNeuron += userContribution; };

        label loop_ for((userPrincipal, {stake_e8s = userContribution }) in Iter.fromArray(contributions)){
            let amountOwedToUser: Nat64 = NatX.nat64ComputePercentage({value = neuronInfo_.stake_e8s; numerator = userContribution; denominator = totalAmountContributedToNeuron});
            ignore performUserPayoutFromNeuronDisbursal(Principal.fromText(userPrincipal), amountOwedToUser);
        };
    };

    public func distributePayoutsFromFundingCampaign(
        campaignId: TreasuryTypes.CampaignId, 
        amountRepaid: Nat64, 
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (), 
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        treasuryCanisterId: Principal,
    ): async (){
        let ?{contributions; amountDisbursedToRecipient; subaccountId = campaignSubaccountId} = fundingCampaignsMap.get(campaignId) else { throw Error.reject("No campaign found") };
        label loop_ for((userPrincipal, {icp = userCampaignContribution}) in Iter.fromArray(contributions)){
            var amountOwedToUser: Nat64 = if(amountDisbursedToRecipient.icp.e8s == 0) { userCampaignContribution.e8s }
            else { NatX.nat64ComputePercentage({value = amountRepaid; numerator = userCampaignContribution.e8s; denominator = amountDisbursedToRecipient.icp.e8s}) };
            let ?{subaccountId = userSubaccountId} = usersTreasuryDataMap.get(userPrincipal) else { continue loop_ };
            ignore performTransfer(amountOwedToUser, { subaccountId = ?campaignSubaccountId; accountType = #FundingCampaign }, { owner = treasuryCanisterId; subaccountId = ?userSubaccountId; accountType = #UserTreasuryData }, updateTokenBalances);
        };
    };

    public func creditCampaignContribution(userPrincipal: Text, campaignId: Nat, amount: Nat64, fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap): () {
        let ?campaign = fundingCampaignsMap.get(campaignId) else { return };
        let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.CampaignContributions>(Iter.fromArray(campaign.contributions), Array.size(campaign.contributions), Text.equal, Text.hash);
        let {icp = userIcpCampaignContribution} = switch(contributionsMap.get(userPrincipal)){
            case (?contribution_) { contribution_ };
            case null { { icp = { e8s: Nat64 = 0} } };
        };
        let updatedCampaignContribution = {icp = { e8s = userIcpCampaignContribution.e8s + amount }};
        contributionsMap.put(userPrincipal, updatedCampaignContribution);
        fundingCampaignsMap.put(campaignId, {campaign with contributions = Iter.toArray(contributionsMap.entries());});
    };

    public func contributeToFundingCampaign(
        contributor: TreasuryTypes.PrincipalAsText, 
        campaignId: Nat, 
        amount: Nat64, 
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap, 
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, 
        treasuryCanisterId: Principal,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
    ) 
    : async TreasuryTypes.FundingCampaignsArray {
        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {subaccountId = fundingCampaignSubaccountId; funded; campaignWalletBalance; amountToFund} = campaign;
        if(funded) throw Error.reject("Campaign already funded.");
        if(campaignWalletBalance.icp.e8s >= amountToFund.icp.e8s) throw Error.reject("Campaign already funded.");
        let amountRemainingToFund = amountToFund.icp.e8s - campaignWalletBalance.icp.e8s;
        let amountToContribute = Nat64.min(amount, amountRemainingToFund);
        let (_, contributorSubaccountId) = SyncronousHelperMethods.getIdAndSubaccount(#Principal(contributor), usersTreasuryDataMap, fundingCampaignsMap);
        let {amountSent} = await performTransfer(amountToContribute + txFee, {subaccountId = ?contributorSubaccountId; accountType = #UserTreasuryData}, {owner = treasuryCanisterId; subaccountId = ?fundingCampaignSubaccountId; accountType = #FundingCampaign}, updateTokenBalances);
        creditCampaignContribution(contributor, campaignId, amountSent, fundingCampaignsMap);
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    public func repayFundingCampaign(
        amount: Nat64, 
        paymentFrom: {subaccountId: ?Account.Subaccount; accountType: TreasuryTypes.AccountType},
        campaignId: Nat,
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        neuronDataMap: TreasuryTypes.NeuronsDataMap, 
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (), 
        treasuryCanisterId: Principal,
    ) : async TreasuryTypes.FundingCampaignsArray {
        if(amount < 10_000) throw Error.reject("Minimum repayment amount is 0.0001 ICP.");
        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {subaccountId = fundingCampaignSubaccountId; funded; recipient; amountDisbursedToRecipient} = campaign;
        if(not funded) throw Error.reject("Campaign funds have not been disbursed yet.");
        let ?terms = campaign.terms else throw Error.reject("Campaign terms not found.");
        let {amountSent} = await performTransfer(
            amount, 
            paymentFrom, 
            {owner = treasuryCanisterId; subaccountId = ?fundingCampaignSubaccountId; accountType = #FundingCampaign},
            updateTokenBalances
        );  
        ignore distributePayoutsFromFundingCampaign(campaignId, amountSent, usersTreasuryDataMap, updateTokenBalances, fundingCampaignsMap, treasuryCanisterId);
        let amountRepaidDuringCurrentPaymentInterval = {icp = { e8s: Nat64 = terms.amountRepaidDuringCurrentPaymentInterval.icp.e8s + amountSent; } };
        var amountToDeductFromPrincipalAmount: Nat64 = 0;
        let remainingLoanInterestAmount = if(terms.remainingLoanInterestAmount.icp.e8s > amountSent) { 
            {icp = {e8s: Nat64 = terms.remainingLoanInterestAmount.icp.e8s - amountSent}}; 
        } else { 
            amountToDeductFromPrincipalAmount := amountSent - terms.remainingLoanInterestAmount.icp.e8s; 
            {icp = {e8s: Nat64 = 0}}; 
        };
        var settled = false;
        var remainingLoanPrincipalAmount = if(terms.remainingLoanPrincipalAmount.icp.e8s > amountToDeductFromPrincipalAmount){
            {icp = {e8s: Nat64 = terms.remainingLoanPrincipalAmount.icp.e8s - amountToDeductFromPrincipalAmount}}  
        } else { settled := true; {icp = {e8s: Nat64 = 0}}; };
        
        let amountToDecollateralize: Nat64 = NatX.nat64ComputePercentage({value = terms.initialCollateralLocked.icp_staked.e8s; numerator = amountToDeductFromPrincipalAmount; denominator = amountDisbursedToRecipient.icp.e8s});
        let collateralRemainingAfterDecollateralization: Nat64 = if(terms.remainingCollateralLocked.icp_staked.e8s > amountToDecollateralize){
            terms.remainingCollateralLocked.icp_staked.e8s - amountToDecollateralize} else { 0 };
        let remainingCollateralLocked = {icp_staked = {e8s = collateralRemainingAfterDecollateralization; fromNeuron = terms.remainingCollateralLocked.icp_staked.fromNeuron; }};
        SyncronousHelperMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = recipient; delta = amountToDecollateralize; neuronId = terms.initialCollateralLocked.icp_staked.fromNeuron; operation = #SubtractCollateralizedStake});
        fundingCampaignsMap.put(campaignId, { campaign with settled; terms = ?{ terms with remainingLoanInterestAmount; remainingLoanPrincipalAmount; amountRepaidDuringCurrentPaymentInterval; remainingCollateralLocked;}; });   
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    public func performTransfer( 
        amount: Nat64, 
        from: {subaccountId: ?Account.Subaccount; accountType: TreasuryTypes.AccountType}, 
        to: { owner: Principal; subaccountId: ?Account.Subaccount; accountType: TreasuryTypes.AccountType },
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (), 
    ) 
    : async {amountSent: Nat64;} {
        if(amount < 10_000) return {amountSent = 0};
        var amountSent = amount - txFee;
        let transferInput = { 
        to = {owner = to.owner; subaccount = switch(to.subaccountId){ case (?id){ ?id }; case (null) { null }; }; };
        from_subaccount: ?Blob = switch(from.subaccountId){ case null { null}; case(?id){ ?id }; }; 
        fee = ?Nat64.toNat(txFee); 
        memo = null; 
        created_at_time = ?Nat64.fromNat(Int.abs(Time.now())); 
        amount = Nat64.toNat(amountSent); 
        };
        let res = await ledger.icrc1_transfer(transferInput);
        switch (res) {
            case (#Ok(_)) {};
            case (#Err(#InsufficientFunds { balance })) {
                if(balance < Nat64.toNat(txFee)){ amountSent := 0; return {amountSent}; }
                else amountSent := Nat64.fromNat(balance) - txFee;
                let res = await ledger.icrc1_transfer({transferInput with amount = Nat64.toNat(amountSent)});
                switch(res){ case (#Ok(_)) {}; case (#Err(_)) { amountSent:= 0; return {amountSent}} };
            };
            case (#Err(_)) { amountSent := 0; return {amountSent} };
        };
        switch(from.subaccountId){
            case null { ignore updateTokenBalances(#SubaccountId(Account.defaultSubaccount()), #Icp, from.accountType); }; 
            case(?id){ ignore updateTokenBalances(#SubaccountId(id), #Icp, from.accountType); };
        };
        switch(to.subaccountId){
            case null { ignore updateTokenBalances(#SubaccountId(Account.defaultSubaccount()), #Icp, to.accountType); }; 
            case(?id){ ignore updateTokenBalances(#SubaccountId(id), #Icp, to.accountType); };
        };
        return {amountSent};
    };
};