import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Blob "mo:base/Blob";
import TreasuryTypes "../../Types/Treasury/types";
import Account "../../Serializers/Account";
import NatX "../../MotokoNumbers/NatX";

module{

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
            let userVotingPower = NatX.nat64ComputePercentage({value = userTotalStake; numerator = neuronTotalVotingPower; denominator = neuronTotalStake});
            contributionsMap.put(contributor, {neuronStakeInfo with voting_power = userVotingPower});
        };
        neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(contributionsMap.entries())});
    };

    public func computeTotalStakeDepositAndVotingPower( neuronDataMap: TreasuryTypes.NeuronsDataMap, pincipal: Text ): TreasuryTypes.NeuronStakeInfo {
        
        var totalStake: Nat64 = 0;
        var totalCollateralizedStake: Nat64 = 0;
        var totalVotingPower: Nat64 = 0;

        label loop_ for((neuronId, {contributions; neuronInfo}) in neuronDataMap.entries()){

            let ?neuronInfo_ = neuronInfo else { continue loop_};
            var totalNeuronContributions: Nat64 = 0;
            for((_, {stake_e8s}) in Iter.fromArray(contributions)){ totalNeuronContributions += stake_e8s; };

            let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>( Iter.fromArray(contributions), Iter.size(Iter.fromArray(contributions)), Text.equal, Text.hash );
            let ?{stake_e8s = userContributions; voting_power; collateralized_stake_e8s} = contributionsMap.get(pincipal) else { continue loop_};

            totalStake += NatX.nat64ComputePercentage({value = neuronInfo_.stake_e8s; numerator = userContributions; denominator = totalNeuronContributions}); 
            totalVotingPower += voting_power; 
            totalCollateralizedStake += switch(collateralized_stake_e8s){ case null { 0; }; case(?collateralized_stake_e8s_) { collateralized_stake_e8s_; }; };
        };
        return {stake_e8s = totalStake; voting_power = totalVotingPower; collateralized_stake_e8s = ?totalCollateralizedStake;};
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
                let delta_ = Nat64.min(userNeuronStakeInfo.stake_e8s, delta);
                updateUserNeuronStakeInfo( neuronDataMap, {userPrincipal; newAmount = userNeuronStakeInfo.stake_e8s - delta_; neuronId; property = #Stake});
            };
            case(#AddCollateralizedStake) { 
                let collateralized_stake_e8s : Nat64 = switch(userNeuronStakeInfo.collateralized_stake_e8s){
                    case null { 0; };
                    case(?collateralized_stake_e8s_) { collateralized_stake_e8s_; };
                };
                let maximumIncreaseAmountToCollateralizedStake = userNeuronStakeInfo.stake_e8s - collateralized_stake_e8s;
                let delta_ =  Nat64.min(maximumIncreaseAmountToCollateralizedStake, delta);
                updateUserNeuronStakeInfo( neuronDataMap, {userPrincipal; newAmount = collateralized_stake_e8s + delta_; neuronId; property = #CollateralizedStake});
            };
            case(#SubtractCollateralizedStake) { 
                let collateralized_stake_e8s: Nat64 = switch(userNeuronStakeInfo.collateralized_stake_e8s){
                    case null { 0; };
                    case(?collateralized_stake_e8s_) { collateralized_stake_e8s_; };
                };
                let delta_: Nat64 = Nat64.min(collateralized_stake_e8s, delta);
                updateUserNeuronStakeInfo( neuronDataMap, {userPrincipal; newAmount = collateralized_stake_e8s - delta_; neuronId; property = #CollateralizedStake});
            };
        };
    };

    // public func finalizeNewlyCreatedNeuronData( placeHolderKey: Text, newNeuronId: Nat64, neuronDataMap: TreasuryTypes.NeuronsDataMap): () {
    //     let ?neuronData = neuronDataMap.remove(placeHolderKey) else { return };
    //     neuronDataMap.put(Nat64.toText(newNeuronId), neuronData);
    // };

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
            let userStakeInNewNeuron = NatX.nat64ComputePercentage({value = newNeuronTotalStake; numerator = userStakeInParentNeuron; denominator = parentNeuronTotalStake});
            newNeuronContributionsMap.put(contributor, { stake_e8s = userStakeInNewNeuron; voting_power = 0; collateralized_stake_e8s = null; });
        };

        neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(newNeuronContributionsMap.entries()); parentNeuronContributions = null;});
        computeNeuronStakeInfosVotingPowers(neuronDataMap, neuronId);
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

    public func getIdAndSubaccount(
        identifier: TreasuryTypes.Identifier,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        fundingCampaignMap: TreasuryTypes.FundingCampaignsMap
    ) : (Text, Account.Subaccount) {
        switch(identifier){
            case(#SubaccountId(subaccount)) {
                for((userPrincipal, {subaccountId}) in usersTreasuryDataMap.entries()){
                    if(Blob.equal(subaccountId, subaccount)) return (userPrincipal, subaccount);
                };
                for((campaignId, {subaccountId}) in fundingCampaignMap.entries()){
                    if(Blob.equal(subaccountId, subaccount)) return (Nat.toText(campaignId), subaccount);
                };
                Debug.trap("Subaccount not found.");
            };
            case(#Principal(principal)) { 
                let ?{subaccountId} = usersTreasuryDataMap.get(principal) else Debug.trap("User not found.");
                return (principal, subaccountId);
            };
            case(#CampaignId(campaignId)) { 
                let ?{subaccountId} = fundingCampaignMap.get(campaignId) else Debug.trap("Campaign not found.");
                return (Nat.toText(campaignId), subaccountId);
            };
        };
    };

    public func formatUserTreasuryDataForExport(neuronDataMap: TreasuryTypes.NeuronsDataMap , (userPrincipal, userTreasuryData): (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryData)): ((TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryDataExport)) {
        let {balances} = userTreasuryData;
        let {stake_e8s; voting_power; collateralized_stake_e8s} = computeTotalStakeDepositAndVotingPower(neuronDataMap, userPrincipal);
        return (userPrincipal, {
            userTreasuryData with 
            balances = {
                balances with 
                icp_staked = {e8s = stake_e8s}; 
                voting_power = {e8s = voting_power; }; 
                icp_staked_collateralized = {
                    e8s: Nat64 = switch(collateralized_stake_e8s){
                        case null { 0 }; 
                        case (?collateralized_stake_e8s_) {collateralized_stake_e8s_ }
                    }
                }
            }
        });          
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
            let stakeCredit = NatX.nat64ComputePercentage({value = amountToDistribute; numerator = lenderContribution.e8s; denominator = totalContributedAmount});
            updateUserNeuronContribution(neuronDataMap, {userPrincipal = principal; delta = stakeCredit; neuronId; operation = #AddStake});
            remainingAmount -= stakeCredit;
        };
        if(remainingAmount > 0) updateUserNeuronContribution(neuronDataMap, {userPrincipal = loanContributions[0].0; delta = remainingAmount; neuronId; operation = #AddStake});
    };

};