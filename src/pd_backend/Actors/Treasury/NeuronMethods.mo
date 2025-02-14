import TreasuryTypes "types";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Governance "../../NNS/Governance"; 
import Int "mo:base/Int";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Blob "mo:base/Blob";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Ledger "../../NNS/Ledger";
import Account "../../Serializers/Account";
import NatX "../../MotokoNumbers/NatX";
import Utils "Utils";


module{

    let txFee: Nat64 = 10_000;

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public let PENDING_NEURON_SUFFIX = "_pendingNeuron";

    public func transferIcpToNeuron( amount: Nat64, memoOrNeuronSubaccountId: {#Memo: Nat64; #NeuronSubaccountId: Blob}, senderSubaccount: Account.Subaccount, controller: Principal): async {amountSent: Nat64} {
        
        let (memo, treasuryNeuronSubaccountId) = switch(memoOrNeuronSubaccountId){
            case(#Memo(memo)) { (memo, Account.neuronSubaccount(controller, memo)); };
            case(#NeuronSubaccountId(subaccount)) { let memo: Nat64 = 0; (memo, subaccount) };
        };
        let treasuryNeuronAccountId = Account.accountIdentifier(Principal.fromText(Governance.CANISTER_ID), treasuryNeuronSubaccountId);
        var amountSent = amount;
        var transferInput = {memo;
          from_subaccount = ?senderSubaccount;
          to = treasuryNeuronAccountId;
          amount = { e8s = amountSent };
          fee = { e8s = txFee };
          created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
        };
        let res = await ledger.transfer(transferInput);
        switch(res){
            case(#Ok(_)) { return {amountSent} };
            case(#Err(#InsufficientFunds { balance })) { 
                if(balance.e8s < 10_000){ return {amountSent: Nat64 = 0} };
                amountSent := balance.e8s - txFee;
                let res = await ledger.transfer({transferInput with amount = { e8s = amountSent }}); 
                switch(res){
                    case(#Ok(_)) { return {amountSent} };
                    case(#Err(_)) { return {amountSent: Nat64 = 0} };
                };
            };
            case(#Err(_)) { return {amountSent: Nat64 = 0}  };
        };
    };

    public func manageNeuron( neuronDataMap: TreasuryTypes.NeuronsDataMap, args: Governance.ManageNeuron, neuronContributionsForNewlyCreatedNeuron: TreasuryTypes.NeuronContributions)
    : async (Governance.ManageNeuronResponse, ?TreasuryTypes.NeuronContributions) {
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
                        if(isProxyOrHasAProxyNeuron(neuronId.id, neuronDataMap)) { throw Error.reject("Neuron is or has a proxy neuron. Cannot disburse such neurons.") };
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
                                if(isProxyOrHasAProxyNeuron(neuronId.id, neuronDataMap)) { throw Error.reject("Neuron is or has a proxy neuron. Cannot disburse such neurons.") };
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
                        let proxyArgs = wrapArgsToProxiedNeuron(args, Nat64.fromNat(proxyNeuronIdAsNat));
                        (proxyArgs, parentNeuronContributions);
                    };
                };
            };
        }; 
        return (await governanceCanister.manage_neuron(args_), neuronContributions);
    };

    public func upateNeuronsDataMap( neuronDataMap: TreasuryTypes.NeuronsDataMap, neuronContributions: ?TreasuryTypes.NeuronContributions): async () {
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
                        populateContributionsArrayFromParentNeuronContributions(neuronDataMap, Nat64.toText(neuronId));
                    };
                };
            };
            computeNeuronStakeInfosVotingPowers(neuronDataMap, Nat64.toText(neuronId));
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
            ignore await Utils.performTransfer(amountOwedToUser, {subaccountId = null; accountType = #MultiSigAccount}, {owner = treasuryCanisterId; subaccountId = ?userSubaccountId; accountType = #UserTreasuryData }, updateTokenBalances);
        };

        let ?{contributions; neuronInfo} = neuronDataMap.get(neuronId) else { throw Error.reject("No neuron found") };
        let ?neuronInfo_ = neuronInfo else { throw Error.reject("No neuronInfo found") };
        var totalAmountContributedToNeuron: Nat64 = 0;
        for((_, {stake_e8s = userContribution }) in Iter.fromArray(contributions)){ totalAmountContributedToNeuron += userContribution; };

        label loop_ for((userPrincipal, {stake_e8s = userContribution }) in Iter.fromArray(contributions)){
            let amountOwedToUser: Nat64 = NatX.nat64ComputeFractionMultiplication({factor = neuronInfo_.stake_e8s; numerator = userContribution; denominator = totalAmountContributedToNeuron});
            ignore performUserPayoutFromNeuronDisbursal(Principal.fromText(userPrincipal), amountOwedToUser);
        };
    };

    public func computeNeuronStakeInfosVotingPowers(
        neuronDataMap:TreasuryTypes.NeuronsDataMap, 
        neuronId: Text
    ): () {
        let ?neuronData = neuronDataMap.get(neuronId) else { return };
        let ?neuronInfo = neuronData.neuronInfo else { return };
        let {stake_e8s = neuronTotalStake; voting_power = neuronTotalVotingPower; } = neuronInfo;
        let {contributions} = neuronData;
        let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
            Iter.fromArray(contributions), 
            Iter.size(Iter.fromArray(contributions)), 
            Text.equal,
            Text.hash
        );
        for((contributor, neuronStakeInfo) in Iter.fromArray(contributions)){
            let {stake_e8s = userTotalStake;} = neuronStakeInfo;
            let userVotingPower = NatX.nat64ComputeFractionMultiplication({factor = userTotalStake; numerator = neuronTotalVotingPower; denominator = neuronTotalStake});
            contributionsMap.put(contributor, {neuronStakeInfo with voting_power = userVotingPower});
        };
        neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(contributionsMap.entries())});
    };

    public func getUserNeuronStakeInfo(userPrincipal: Text, neruonsDataMap: TreasuryTypes.NeuronsDataMap, neuronId: Text): TreasuryTypes.NeuronStakeInfo {
        let ?neuronData = neruonsDataMap.get(neuronId) else { return  { stake_e8s : Nat64 = 0; voting_power : Nat64 = 0; collateralized_stake_e8s = null }; };
        let {contributions} = neuronData;
        let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
            Iter.fromArray(contributions), 
            Iter.size(Iter.fromArray(contributions)), 
            Text.equal,
            Text.hash
        );
        let ?neuronStakeInfo = contributionsMap.get(userPrincipal) else { return  { stake_e8s : Nat64 = 0; voting_power : Nat64 = 0; collateralized_stake_e8s = null}; };
        return neuronStakeInfo;
    };

    public func updateUserNeuronStakeInfo(
        neuronDataMap:TreasuryTypes.NeuronsDataMap, 
        { userPrincipal: Text; newAmount: Nat64; neuronId: Text; property: {#Stake; #VotingPower; #CollateralizedStake} }
    ): () {
        let neuronData = switch(neuronDataMap.get(neuronId)){
            case null { {neuron = null; neuronInfo = null; parentNeuronContributions = null; contributions = []; proxyNeuron = null; };};
            case(?neuronData_){ neuronData_ };
        };
        let {contributions} = neuronData;
        let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
            Iter.fromArray(contributions), 
            Iter.size(Iter.fromArray(contributions)), 
            Text.equal,
            Text.hash
        );
        var neuronStakeInfo = getUserNeuronStakeInfo(userPrincipal, neuronDataMap, neuronId);

        neuronStakeInfo := switch(property){
            case(#Stake) { {neuronStakeInfo with stake_e8s = newAmount}; };
            case(#VotingPower) { {neuronStakeInfo with voting_power = newAmount}; };
            case(#CollateralizedStake) { {neuronStakeInfo with collateralized_stake_e8s = ?newAmount}; };
        };
        contributionsMap.put(userPrincipal, neuronStakeInfo);
        neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(contributionsMap.entries())});
        computeNeuronStakeInfosVotingPowers(neuronDataMap, neuronId);
    };

    public func updateUserNeuronContribution(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        {userPrincipal: Text; delta: Nat64; neuronId: Text; operation: {#AddStake; #SubtractStake; #AddCollateralizedStake; #SubtractCollateralizedStake; } }
    ): () {
        let userNeuronStakeInfo = getUserNeuronStakeInfo(userPrincipal, neuronDataMap, neuronId);
        switch(operation){
            case(#AddStake) { updateUserNeuronStakeInfo( neuronDataMap, {userPrincipal; newAmount = userNeuronStakeInfo.stake_e8s + delta; neuronId; property = #Stake}); };
            case(#SubtractStake) {
                let amountToSubtract = Nat64.min(userNeuronStakeInfo.stake_e8s, delta);
                let newAmount: Nat64 = userNeuronStakeInfo.stake_e8s - amountToSubtract;
                updateUserNeuronStakeInfo( neuronDataMap, {userPrincipal; newAmount; neuronId; property = #Stake});
            };
            case(#AddCollateralizedStake) { 
                let collateralized_stake_e8s : Nat64 = switch(userNeuronStakeInfo.collateralized_stake_e8s){ case null { 0; }; case(?collateralized_stake_e8s_) { collateralized_stake_e8s_; }; };
                let newAmount =  Nat64.min(userNeuronStakeInfo.stake_e8s, collateralized_stake_e8s + delta);
                updateUserNeuronStakeInfo( neuronDataMap, {userPrincipal; newAmount; neuronId; property = #CollateralizedStake});
            };
            case(#SubtractCollateralizedStake) { 
                let collateralized_stake_e8s: Nat64 = switch(userNeuronStakeInfo.collateralized_stake_e8s){ case null { 0; }; case(?collateralized_stake_e8s_) { collateralized_stake_e8s_; }; };
                let amountToSubtract = Nat64.min(collateralized_stake_e8s, delta);
                let newAmount: Nat64 = collateralized_stake_e8s - amountToSubtract;
                updateUserNeuronStakeInfo( neuronDataMap, {userPrincipal; newAmount; neuronId; property = #CollateralizedStake});
            };
        };
    };

    public func populateContributionsArrayFromParentNeuronContributions(neuronDataMap: TreasuryTypes.NeuronsDataMap, neuronId: Text): () {
        let ?neuronData = neuronDataMap.get(neuronId) else { return };

        let ?neuronInfo = neuronData.neuronInfo else { return };
        let {stake_e8s = newNeuronTotalStake; } = neuronInfo;

        let ?parentNeuronContributions = neuronData.parentNeuronContributions else { return };
        let parentNeuronContributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
            Iter.fromArray(parentNeuronContributions), 
            Iter.size(Iter.fromArray(parentNeuronContributions)), 
            Text.equal,
            Text.hash
        );

        var parentNeuronTotalStake: Nat64 = 0;
        for((contributor, {stake_e8s}) in parentNeuronContributionsMap.entries()){ parentNeuronTotalStake += stake_e8s; };
        let {contributions} = neuronData;
        let newNeuronContributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
            Iter.fromArray(contributions), 
            Iter.size(Iter.fromArray(contributions)), 
            Text.equal,
            Text.hash
        );

        for((contributor, neuronStakeInfo) in parentNeuronContributionsMap.entries()){
            let {stake_e8s = userStakeInParentNeuron} = neuronStakeInfo;
            let userStakeInNewNeuron = NatX.nat64ComputeFractionMultiplication({factor = newNeuronTotalStake; numerator = userStakeInParentNeuron; denominator = parentNeuronTotalStake});
            newNeuronContributionsMap.put(contributor, { stake_e8s = userStakeInNewNeuron; voting_power = 0; collateralized_stake_e8s = null; });
        };

        neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(newNeuronContributionsMap.entries()); parentNeuronContributions = null;});
        computeNeuronStakeInfosVotingPowers(neuronDataMap, neuronId);
    };

    public func redistributeStakeToLoanContributors(
        amountToDistribute: Nat64, 
        loanContributions: TreasuryTypes.CampaignContributionsArray, 
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        neuronId: TreasuryTypes.NeuronIdAsText
    ): () {
        var remainingAmount = amountToDistribute;
        var totalContributedAmount: Nat64 = 0;
        for((_, {icp = lenderContribution}) in Iter.fromArray(loanContributions)) totalContributedAmount += lenderContribution.e8s;
        label distributionLoop for ((principal, {icp = lenderContribution}) in Iter.fromArray(loanContributions)){
            let stakeCredit = NatX.nat64ComputeFractionMultiplication({factor = amountToDistribute; numerator = lenderContribution.e8s; denominator = totalContributedAmount});
            updateUserNeuronContribution(neuronDataMap, {userPrincipal = principal; delta = stakeCredit; neuronId; operation = #AddStake});
            remainingAmount -= stakeCredit;
        };
        if(remainingAmount > 0) updateUserNeuronContribution(neuronDataMap, {userPrincipal = loanContributions[0].0; delta = remainingAmount; neuronId; operation = #AddStake});
    };

    public func isProxyOrHasAProxyNeuron(neuronId: Nat64, neuronDataMap: TreasuryTypes.NeuronsDataMap): Bool {
        let ?{proxyNeuron} = neuronDataMap.get(Nat64.toText(neuronId)) else { Debug.trap("No neuron data for neuronId") };
        if(proxyNeuron != null) { return true };
        label checkingIsNeuronAProxyNeuron for((_,{proxyNeuron}) in neuronDataMap.entries()){
            let ?proxyNeuron_ = proxyNeuron else continue checkingIsNeuronAProxyNeuron;
            if(proxyNeuron_ == Nat64.toText(neuronId)) { return true };
        };
        return false;
    };

    public func wrapArgsToProxiedNeuron(args: Governance.ManageNeuron, proxyNeuronId: Nat64): Governance.ManageNeuron {
        return {
            id = ?{ id = proxyNeuronId }; 
            neuron_id_or_subaccount = null;
            command = ?#MakeProposal({
                url = "https://forum.dfinity.org/t/personal-dao-canister-controlled-neuron-types-proxied-neurons-vs-non-proxied-neurons/36013";
                title = ?"Proposal to manage DAO's neuron created with a tECDSA Signed HTTPS outcall via a proxy neuron";
                action = ?#ManageNeuron(args);
                summary = "See URL for details";
            });
        };
        
    };

};