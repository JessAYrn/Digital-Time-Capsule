import TreasuryTypes "../../Types/Treasury/types";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import NeuronManager "../HTTPRequests/NeuronManager";
import Governance "../../NNS/Governance";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
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
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        transformFn: NeuronManager.TransformFnSignature,
        args: Governance.ManageNeuron,
        proposer: ?Principal,
        treasuryCanisterId: ?Principal,
        selfAuthPrincipal: Principal,
        publicKey: Blob
    ): async Result.Result<(), TreasuryTypes.Error> {
        
        let ?neuronId = args.id else {
            actionLogsArrayBuffer.add(Int.toText(Time.now()), "No neuronId in request");
            Debug.trap("No neuronId in request");
        };
        let ?command = args.command else {
            actionLogsArrayBuffer.add(Int.toText(Time.now()), "No command in request");
            Debug.trap("No command in request");
        };

        let pendingActionId : Text = switch(command){
            case(#Spawn(_)) { "spawn_"#Nat64.toText(neuronId.id); };
            case(#Follow(_)) { "follow_"#Nat64.toText(neuronId.id); };
            case(#Configure(_)) { "configure_"#Nat64.toText(neuronId.id); };
            case(#Disburse(_)) { "disburse_"#Nat64.toText(neuronId.id); };
            case(#ClaimOrRefresh(_)) { "claimOrRefresh_"#Nat64.toText(neuronId.id);};
            case(_) { return #err(#ActionNotSupported) };
        };
        let newPendingAction: TreasuryTypes.PendingAction = {
            expectedHttpResponseType = ?#GovernanceManageNeuronResponse({neuronId = ?neuronId.id; memo = null; proposer; treasuryCanisterId; });
            function = #ManageNeuron({  input = {args; selfAuthPrincipal; public_key = publicKey; transformFn;} });
        };
        pendingActionsMap.put(pendingActionId, newPendingAction);
        actionLogsArrayBuffer.add(Int.toText(Time.now()),"New Action Pending: "#pendingActionId);
        ignore resolvePendingActionFromQueue( 
            neuronDataMap, 
            usersTreasuryDataMap, 
            pendingActionsMap, 
            actionLogsArrayBuffer, 
            memoToNeuronIdMap, 
            updateTokenBalances,
            fundingCampaignsMap, 
            transformFn
        );
        return #ok(());
    };

    public func increaseNeuron(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        transformFn: NeuronManager.TransformFnSignature,
        {amount: Nat64; neuronId: Nat64; contributor: Principal; selfAuthPrincipal: Principal; publicKey: Blob}
    ) : async Result.Result<({amountSent: Nat64}), TreasuryTypes.Error>  {

        let ?neuronData = neuronDataMap.get(Nat64.toText(neuronId)) else Debug.trap("No neuron data for neuronId");
        let ?neuron = neuronData.neuron else Debug.trap("No neuron for neuronId");
        let {account = neuronSubaccount} = neuron;
        let ?{subaccountId} = usersTreasuryDataMap.get(Principal.toText(contributor)) else Debug.trap("No subaccount for contributor");
        let {amountSent} = await NeuronManager.transferIcpToNeuron(amount, #NeuronSubaccountId(neuronSubaccount), subaccountId, selfAuthPrincipal);
        ignore updateTokenBalances(#Principal(Principal.toText(contributor)), #Icp, #UserTreasuryData);
        SyncronousHelperMethods.updateUserNeuronContribution( neuronDataMap,{ userPrincipal = Principal.toText(contributor);  delta = amountSent; neuronId = Nat64.toText(neuronId); operation = #AddStake; });
        let args = { id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#Subaccount(neuronSubaccount); };
        let newPendingAction: TreasuryTypes.PendingAction = {
            expectedHttpResponseType = ?#GovernanceManageNeuronResponse({neuronId = ?neuronId; memo = null; proposer = null; treasuryCanisterId = null; });
            function = #ManageNeuron({ input = { args; selfAuthPrincipal; public_key = publicKey; transformFn; method_name = TreasuryTypes.GetNeuronDataMethodNames.getFullNeuron }; });
        };
        
        pendingActionsMap.put("claimOrRefresh_"#Nat64.toText(neuronId), newPendingAction);
        actionLogsArrayBuffer.add(Int.toText(Time.now()),"New Action Pending: claimOrRefresh_"#Nat64.toText(neuronId));
        ignore resolvePendingActionFromQueue( 
            neuronDataMap, 
            usersTreasuryDataMap, 
            pendingActionsMap, 
            actionLogsArrayBuffer, 
            memoToNeuronIdMap, 
            updateTokenBalances,
            fundingCampaignsMap, 
            transformFn
        );
        return #ok({amountSent});
    };

    public func createNeuron(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        transformFn: NeuronManager.TransformFnSignature,
        {amount: Nat64; contributor: Principal; neuronMemo: Nat64; selfAuthPrincipal: Principal; publicKey: Blob}
    ) : async Result.Result<({amountSent: Nat64}), TreasuryTypes.Error>  {

        let ?{subaccountId} = usersTreasuryDataMap.get(Principal.toText(contributor)) else Debug.trap("No subaccount for contributor");
        let {amountSent} = await NeuronManager.transferIcpToNeuron(amount, #Memo(neuronMemo), subaccountId, selfAuthPrincipal);
        ignore updateTokenBalances(#Principal(Principal.toText(contributor)), #Icp, #UserTreasuryData);
        let newNeuronIdPlaceholderKey : Text = Nat64.toText(neuronMemo)#PENDING_NEURON_SUFFIX;
        SyncronousHelperMethods.updateUserNeuronContribution( neuronDataMap,{ userPrincipal = Principal.toText(contributor);  delta = amountSent; neuronId = newNeuronIdPlaceholderKey; operation = #AddStake;});
        let args = { id = null; command = ?#ClaimOrRefresh( {by = ?#MemoAndController( {controller = ?selfAuthPrincipal; memo = neuronMemo} )} ); neuron_id_or_subaccount = null; };
        let newPendingAction: TreasuryTypes.PendingAction = {
            expectedHttpResponseType = ?#GovernanceManageNeuronResponse({neuronId = null; memo = ?neuronMemo; proposer = null; treasuryCanisterId = null; });
            function = #ManageNeuron({ input = {args; selfAuthPrincipal; public_key = publicKey; transformFn;} });
        };
        pendingActionsMap.put("createNeuronResponse_"#Nat64.toText(neuronMemo), newPendingAction);
        actionLogsArrayBuffer.add(Int.toText(Time.now()),"New Action Pending: createNeuronResponse_"#Nat64.toText(neuronMemo));
        ignore resolvePendingActionFromQueue( 
            neuronDataMap, 
            usersTreasuryDataMap, 
            pendingActionsMap, 
            actionLogsArrayBuffer, 
            memoToNeuronIdMap, 
            updateTokenBalances, 
            fundingCampaignsMap,
            transformFn
        );
        return #ok({amountSent});
        
    };

    public func refreshNeuronsData(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        transformFn: NeuronManager.TransformFnSignature,
        selfAuthPrincipal: Principal,
        publicKey: Blob
    ) : async () {

        label populatePendingActionsLoop for((_, neuronData) in neuronDataMap.entries()){
            let ?neuron = neuronData.neuron else continue populatePendingActionsLoop;
            let ?neuronId = neuron.id else continue populatePendingActionsLoop;
            let args = { id = null; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount( {} )} );neuron_id_or_subaccount = ?#NeuronId(neuronId); };
            let newPendingAction: TreasuryTypes.PendingAction = {
                expectedHttpResponseType = ?#GovernanceManageNeuronResponse({neuronId = ?neuronId.id; memo = null; proposer = null; treasuryCanisterId = null; });
                function = #ManageNeuron({ input = {args; selfAuthPrincipal; public_key = publicKey; transformFn;} });
            };                
            pendingActionsMap.put("claimOrRefresh_"#Nat64.toText(neuronId.id), newPendingAction);
        };

        ignore resolvePendingActionFromQueue( 
            neuronDataMap, 
            usersTreasuryDataMap, 
            pendingActionsMap, 
            actionLogsArrayBuffer, 
            memoToNeuronIdMap, 
            updateTokenBalances, 
            fundingCampaignsMap,
            transformFn
        );
    };

    public func resolvePendingActionFromQueue(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        pendingActionsMap: TreasuryTypes.PendingActionsMap,
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType ) -> async (),
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        transformFn: NeuronManager.TransformFnSignature
    ): async () {

        func resolvePendingAction_(identifier: Text, action: TreasuryTypes.PendingAction): async () {
            try{
                actionLogsArrayBuffer.add(Int.toText(Time.now()),"Resolving pending action: "#identifier#", making HTTPS request to NNS governance canister.");
                let ({response; requestId; ingress_expiry;}, selfAuthPrincipal, publicKey) = switch(action.function){
                    case (#ManageNeuron({input;})) { (await NeuronManager.manageNeuron(input),input.selfAuthPrincipal, input.public_key ); };
                    case (#GetNeuronData({input;})){ (await NeuronManager.getNeuronData(input), input.selfAuthPrincipal, input.public_key); };
                };
                if(response.status != 202) { actionLogsArrayBuffer.add(Int.toText(Time.now()),"Action failed. HTTPS status returned is NOT 202"); throw Error.reject("Action failed. HTTPS status returned is NOT 202"); };
                let ?expectedResponseType = action.expectedHttpResponseType else { throw Error.reject("No expected response type for action: "#identifier); };
                let readRequestResponseInput = {response; requestId; expiry = ingress_expiry; expectedResponseType;};
                let failedAttempts: Nat = 0;
                actionLogsArrayBuffer.add(Int.toText(Time.now()),"RequestID received for: "#identifier#". Reading Response From NNS Governance Canister.");
                let readRequestResponseOutput = await NeuronManager.readRequestResponse(readRequestResponseInput, selfAuthPrincipal, publicKey, transformFn, failedAttempts);
                let processResponseInput: TreasuryTypes.ProcessResponseInput = {readRequestResponseOutput; neuronDataMap; usersTreasuryDataMap; pendingActionsMap; actionLogsArrayBuffer; memoToNeuronIdMap; updateTokenBalances; selfAuthPrincipal; publicKey; transformFn; identifier; fundingCampaignsMap};
                ignore pendingActionsMap.remove(identifier);
                actionLogsArrayBuffer.add(Int.toText(Time.now()),"Processing Response for: "#identifier);
                let {newPendingAction} = try { await processResponse(processResponseInput); }
                catch(e){ actionLogsArrayBuffer.add(Int.toText(Time.now()),"Failed to process response for: "#identifier#". Error: "#Error.message(e)); return; };
                actionLogsArrayBuffer.add(Int.toText(Time.now()),"Processing completed for response: "#identifier);
                if(newPendingAction) ignore resolvePendingActionFromQueue( neuronDataMap, usersTreasuryDataMap, pendingActionsMap, actionLogsArrayBuffer, memoToNeuronIdMap, updateTokenBalances,fundingCampaignsMap, transformFn);
            } catch(e){ actionLogsArrayBuffer.add(Int.toText(Time.now()),"Failed to resolve pending action: "#identifier#". Cause of error: " #Error.message(e)); };
        };

        let pendingActionsArray = Iter.toArray(pendingActionsMap.entries());
        let length = Array.size(pendingActionsArray);
        if(length == 0) throw Error.reject("No pending actions to resolve");
        var index = 0;
        label loop_ while(index < length){
            let (identifier, action) = pendingActionsArray[index];
            ignore resolvePendingAction_(identifier, action); 
            index += 1;
        };


    };

    public func processResponse({
        neuronDataMap: TreasuryTypes.NeuronsDataMap;
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        pendingActionsMap: TreasuryTypes.PendingActionsMap;
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer;
        memoToNeuronIdMap: TreasuryTypes.MemoToNeuronIdMap;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ();
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        readRequestResponseOutput: TreasuryTypes.ReadRequestResponseOutput;
        selfAuthPrincipal: Principal;
        publicKey: Blob;
        transformFn: TreasuryTypes.TransformFnSignature;
    }): async {newPendingAction: Bool;} {

        func createPendingActionsToUpdateNeuronData(neuronId: Nat64){
            let newPendingAction: TreasuryTypes.PendingAction = {
                    expectedHttpResponseType = ?#GovernanceResult_2({neuronId});
                    function = #GetNeuronData({ input = {args = neuronId; selfAuthPrincipal; public_key = publicKey; transformFn; method_name = TreasuryTypes.GetNeuronDataMethodNames.getFullNeuron}; }); 
                };
            let newPendingAction2: TreasuryTypes.PendingAction = {
                expectedHttpResponseType = ?#GovernanceResult_5({neuronId});
                function = #GetNeuronData({ input = {args = neuronId; selfAuthPrincipal; public_key = publicKey; transformFn; method_name = TreasuryTypes.GetNeuronDataMethodNames.getNeuronInfo}; }); };
            pendingActionsMap.put("getFullNeuronResponse_"#Nat64.toText(neuronId), newPendingAction);
            pendingActionsMap.put("getNeuronInfoResponse_"#Nat64.toText(neuronId), newPendingAction2);
        };

        switch(readRequestResponseOutput){
            case(#ClaimOrRefresh({memo; neuronId})){
                if(memo != null){
                    let ?memo_ = memo else { throw Error.reject("No memo for newly created neuron") } ;
                    memoToNeuronIdMap.put(Nat64.toNat(memo_), neuronId);
                    SyncronousHelperMethods.finalizeNewlyCreatedNeuronData(Nat64.toText(memo_)#PENDING_NEURON_SUFFIX, neuronId, neuronDataMap);
                };
                createPendingActionsToUpdateNeuronData(neuronId);
                return {newPendingAction = true};
            };
            case(#Spawn({created_neuron_id; neuronId;})){
                neuronDataMap.put(Nat64.toText(created_neuron_id), {neuron = null; neuronInfo = null; parentNeuronContributions = null; contributions = []; });

                let ?parentNeuron = neuronDataMap.get(Nat64.toText(neuronId)) else { throw Error.reject("no neuron found") };
                let parentNeuronContributions = ?parentNeuron.contributions;
                neuronDataMap.put(Nat64.toText(created_neuron_id), {neuron = null; neuronInfo = null; parentNeuronContributions; contributions = []; });
                createPendingActionsToUpdateNeuronData(neuronId);
                createPendingActionsToUpdateNeuronData(created_neuron_id);
                return {newPendingAction = true};
            };
            case(#Follow({neuronId;})){
                createPendingActionsToUpdateNeuronData(neuronId);
                return {newPendingAction = true};
            };
            case(#Configure({neuronId;})){
                createPendingActionsToUpdateNeuronData(neuronId);
                return {newPendingAction = true};
            };
            case(#Disburse({neuronId; treasuryCanisterId})){
                await distributePayoutsFromNeuron( Nat64.toText(neuronId), usersTreasuryDataMap, actionLogsArrayBuffer, updateTokenBalances, fundingCampaignsMap, neuronDataMap, treasuryCanisterId);
                ignore neuronDataMap.remove(Nat64.toText(neuronId));
                return {newPendingAction = false};
            };
            case(#Error({error_message;})){throw Error.reject(error_message) };
            case(#GovernanceResult_2({response; neuronId;})){
                switch(response){
                    case(#Ok(neuron)){
                        let ?neuronData = neuronDataMap.get(Nat64.toText(neuronId)) else { throw Error.reject("neuronData Not Found") };
                        neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuron = ?neuron }); 
                        return {newPendingAction = false};
                    }; 
                    case(#Err({error_message;})){ throw Error.reject(error_message) };
                };
            };
            case(#GovernanceResult_5({response; neuronId;})){
                switch(response){
                    case(#Ok(neuronInfo)){
                        switch(neuronDataMap.get(Nat64.toText(neuronId))){
                            case null { throw Error.reject("neuronInfo Not Found") };
                            case(?neuronData){
                                neuronDataMap.put(Nat64.toText(neuronId), {neuronData with neuronInfo = ?neuronInfo});
                                SyncronousHelperMethods.computeNeuronStakeInfosVotingPowers(neuronDataMap, Nat64.toText(neuronId));
                                if(neuronData.contributions.size() == 0) SyncronousHelperMethods.populateContributionsArrayFromParentNeuronContributions(neuronDataMap, Nat64.toText(neuronId));
                                {newPendingAction = false};
                            };
                        };
                    }; 
                    case(#Err({error_message})){ throw Error.reject(error_message) };
                };
            };
        };
    };

    public func distributePayoutsFromNeuron(
        neuronId: TreasuryTypes.NeuronIdAsText,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, 
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (), 
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        treasuryCanisterId: Principal,
    ): async () {
        
        func performUserPayoutFromNeuronDisbursal(userPrincipal: Principal, userTotalNeuronContributionAmount: Nat64) : async () {

            var numberOfDebtsToRepay: Nat64 = 0;
            var totalOutStandingPaymentOwed: Nat64 = 0;
            label getDebtInfo for((campaignId, {terms; funded; recipient; settled}) in fundingCampaignsMap.entries()){
                if(not funded or settled or recipient != Principal.toText(userPrincipal)) continue getDebtInfo;
                let ?{paymentAmounts; amountRepaidDuringCurrentPaymentInterval} = terms else continue getDebtInfo;
                if(amountRepaidDuringCurrentPaymentInterval.icp.e8s < paymentAmounts.icp.e8s){ 
                    let outStandingPaymentOwed = paymentAmounts.icp.e8s - amountRepaidDuringCurrentPaymentInterval.icp.e8s;
                    totalOutStandingPaymentOwed += outStandingPaymentOwed; 
                    numberOfDebtsToRepay += 1;
                };
            };

            let amountOfUserContributionsReservedToPayDebts: Nat64 = Nat64.min(userTotalNeuronContributionAmount, totalOutStandingPaymentOwed);
            var amountOfUserNeuronContributionsUsedToPayDebts: Nat64 = 0;
            if(numberOfDebtsToRepay > 0){
                label repayDebts for ((campaignId, campaign) in fundingCampaignsMap.entries()){
                    let {settled; funded; recipient; terms} = campaign;
                    if(not funded or settled or recipient != Principal.toText(userPrincipal)) continue repayDebts;
                    let ?{paymentAmounts; amountRepaidDuringCurrentPaymentInterval} = terms else continue repayDebts;
                    if(amountRepaidDuringCurrentPaymentInterval.icp.e8s > paymentAmounts.icp.e8s) continue repayDebts;
                    let debtRepaymentAmountOwed: Nat64 = paymentAmounts.icp.e8s - amountRepaidDuringCurrentPaymentInterval.icp.e8s;
                    let amountToAllocateTowardsDebtRepayment = Nat64.min(
                        debtRepaymentAmountOwed,
                        NatX.nat64ComputePercentage({value = amountOfUserContributionsReservedToPayDebts; numerator = 1; denominator = numberOfDebtsToRepay})
                    );
                    ignore repayFundingCampaign( amountToAllocateTowardsDebtRepayment, {subaccountId = null; accountType = #MultiSigAccount}, campaignId, fundingCampaignsMap, usersTreasuryDataMap, neuronDataMap, actionLogsArrayBuffer, updateTokenBalances, treasuryCanisterId);
                    amountOfUserNeuronContributionsUsedToPayDebts += amountToAllocateTowardsDebtRepayment;
                }; 
            };

            let amountOfUserNeuronContributionsReservedToContributeToFundingCampaigns: Nat64 = userTotalNeuronContributionAmount - amountOfUserNeuronContributionsUsedToPayDebts;
            var amountRemainingToPayoutToUser: Nat64 = amountOfUserNeuronContributionsReservedToContributeToFundingCampaigns;
            if(amountOfUserNeuronContributionsReservedToContributeToFundingCampaigns < txFee) return;

            label contributeRewardsToFundingCampaigns for((campaignId, campaign) in fundingCampaignsMap.entries()){
                let {settled; funded; percentageOfDaoRewardsAllocated} = campaign;
                if(settled or funded) continue contributeRewardsToFundingCampaigns;
                let amountToAllocateToCampaign = NatX.nat64ComputePercentage({value = amountOfUserNeuronContributionsReservedToContributeToFundingCampaigns; numerator = Nat64.fromNat(percentageOfDaoRewardsAllocated); denominator = 100});
                ignore contributeToFundingCampaign( Principal.toText(userPrincipal), campaignId, amountToAllocateToCampaign, fundingCampaignsMap, usersTreasuryDataMap, treasuryCanisterId, actionLogsArrayBuffer, updateTokenBalances);
                amountRemainingToPayoutToUser -= amountToAllocateToCampaign;
            };
            let ?{subaccountId = userSubaccountId} = usersTreasuryDataMap.get(Principal.toText(userPrincipal)) else { return };
            ignore performTransfer(amountRemainingToPayoutToUser, {subaccountId = null; accountType = #MultiSigAccount}, {owner = treasuryCanisterId; subaccountId = ?userSubaccountId; accountType = #UserTreasuryData }, actionLogsArrayBuffer, updateTokenBalances);
        };

        let ?{contributions} = neuronDataMap.get(neuronId) else { throw Error.reject("No neuron found") };
        label loop_ for((userPrincipal, {stake_e8s }) in Iter.fromArray(contributions)){
            ignore performUserPayoutFromNeuronDisbursal(Principal.fromText(userPrincipal), stake_e8s);
        };
    };

    public func distributePayoutsFromFundingCampaign(
        campaignId: TreasuryTypes.CampaignId, 
        amountRepaid: Nat64, 
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (), 
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        treasuryCanisterId: Principal,
    ): async (){
        let ?{contributions; amountDisbursedToRecipient; subaccountId = campaignSubaccountId} = fundingCampaignsMap.get(campaignId) else { throw Error.reject("No campaign found") };
        label loop_ for((userPrincipal, {icp = userCampaignContribution}) in Iter.fromArray(contributions)){
            var amountOwedToUser: Nat64 = if(amountDisbursedToRecipient.icp.e8s == 0) { userCampaignContribution.e8s }
            else { NatX.nat64ComputePercentage({value = amountRepaid; numerator = userCampaignContribution.e8s; denominator = amountDisbursedToRecipient.icp.e8s}) };
            let ?{subaccountId = userSubaccountId} = usersTreasuryDataMap.get(userPrincipal) else { continue loop_ };
            ignore performTransfer(amountOwedToUser, { subaccountId = ?campaignSubaccountId; accountType = #FundingCampaign }, { owner = treasuryCanisterId; subaccountId = ?userSubaccountId; accountType = #UserTreasuryData }, actionLogsArrayBuffer, updateTokenBalances);
        };
    };

    public func creditCampaignContribution(userPrincipal: Text, campaignId: Nat, amount: Nat64, fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap): async () {
        let ?campaign = fundingCampaignsMap.get(campaignId) else { return };
        let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.CampaignContributions>(Iter.fromArray(campaign.contributions), Array.size(campaign.contributions), Text.equal, Text.hash);
        let {icp = userIcpCampaignContribution} = switch(contributionsMap.get(userPrincipal)){
            case (?contribution_) { contribution_ };
            case null { { icp = { e8s: Nat64 = 0} } };
        };
        let updatedCampaignContribution = {icp = { e8s = userIcpCampaignContribution.e8s + amount }};
        contributionsMap.put(userPrincipal, updatedCampaignContribution);
        let updatedContributions = Iter.toArray(contributionsMap.entries());
        fundingCampaignsMap.put(campaignId, {campaign with contributions = updatedContributions;});
    };

    public func contributeToFundingCampaign(
        contributor: TreasuryTypes.PrincipalAsText, 
        campaignId: Nat, 
        amount: Nat64, 
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap, 
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, 
        treasuryCanisterId: Principal,
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (),
    ) 
    : async TreasuryTypes.FundingCampaignsArray {
        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {subaccountId = fundingCampaignSubaccountId; funded;} = campaign;
        if(funded) throw Error.reject("Campaign already funded.");
        let (_, contributorSubaccountId) = SyncronousHelperMethods.getIdAndSubaccount(#Principal(contributor), usersTreasuryDataMap, fundingCampaignsMap);
        let {amountSent} = await performTransfer(amount, {subaccountId = ?contributorSubaccountId; accountType = #UserTreasuryData}, {owner = treasuryCanisterId; subaccountId = ?fundingCampaignSubaccountId; accountType = #FundingCampaign}, actionLogsArrayBuffer, updateTokenBalances);
        await creditCampaignContribution(contributor, campaignId, amountSent, fundingCampaignsMap);
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    public func repayFundingCampaign(
        amount: Nat64, 
        paymentFrom: {subaccountId: ?Account.Subaccount; accountType: TreasuryTypes.AccountType},
        campaignId: Nat,
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        neuronDataMap: TreasuryTypes.NeuronsDataMap, 
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (), 
        treasuryCanisterId: Principal,
    ) : async TreasuryTypes.FundingCampaignsArray {
        if(amount < 10_000_000) throw Error.reject("Minimum repayment amount is 0.1 ICP.");
        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {subaccountId = fundingCampaignSubaccountId; funded; recipient; amountDisbursedToRecipient} = campaign;
        if(not funded) throw Error.reject("Campaign funds have not been disbursed yet.");
        let ?terms = campaign.terms else throw Error.reject("Campaign terms not found.");
        let {amountSent} = await performTransfer(
            amount, 
            paymentFrom, 
            {owner = treasuryCanisterId; subaccountId = ?fundingCampaignSubaccountId; accountType = #FundingCampaign},
            actionLogsArrayBuffer,
            updateTokenBalances
        );  
        await distributePayoutsFromFundingCampaign(campaignId, amountSent, usersTreasuryDataMap, actionLogsArrayBuffer, updateTokenBalances, fundingCampaignsMap, treasuryCanisterId);
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
        actionLogsArrayBuffer: TreasuryTypes.ActionLogsArrayBuffer,
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
                if(balance < Nat64.toNat(txFee)){ amountSent := 0; } 
                else amountSent := Nat64.fromNat(balance) - txFee;
                let res = await ledger.icrc1_transfer({transferInput with amountSent});
                switch(res){ case (#Ok(_)) {}; case (#Err(_)) { amountSent:= 0} };
            };
            case (#Err(_)) { amountSent := 0 };
        };
        if(amount - txFee > amountSent){
            let icpOwed = amount - txFee - amountSent;
            actionLogsArrayBuffer.add(
                Int.toText(Time.now()),
                "Failed to distribute full payment to user "#Principal.toText(to.owner)#". 
                This user is owed: "#Nat64.toText(icpOwed)#" ICP from the DAO's multi-sig wallet."
            );
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