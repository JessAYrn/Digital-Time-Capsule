import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import Int64 "mo:base/Int64";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import TreasuryTypes "../../Types/Treasury/types";
import Account "../../Serializers/Account";

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
            let {stake_e8s = userTotalStake} = neuronStakeInfo;
            let userTotalStakeAsFloat = Float.fromInt64(Int64.fromNat64(userTotalStake));
            let neuronTotalStakeAsFloat = Float.fromInt64(Int64.fromNat64(neuronTotalStake));
            let neuronTotalVotingPowerAsFloat = Float.fromInt64(Int64.fromNat64(neuronTotalVotingPower));
            let userVotingPowerAsFloat = Float.floor(userTotalStakeAsFloat * (neuronTotalVotingPowerAsFloat / neuronTotalStakeAsFloat));
            let userVotingPower = Int64.toNat64(Float.toInt64(userVotingPowerAsFloat));
            contributionsMap.put(contributor, {neuronStakeInfo with voting_power = userVotingPower});
        };
        neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(contributionsMap.entries())});
    };

    public func computeTotalStakeDepositAndVotingPower(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        pincipal: Text
    ): {icp_staked: {e8s: Nat64}; voting_power: {e8s: Nat64};} {
        
        var totalStake: Nat64 = 0;
        var totalVotingPower: Nat64 = 0;

        label loop_ for((neuronId, {contributions}) in neuronDataMap.entries()){
            let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>( Iter.fromArray(contributions), Iter.size(Iter.fromArray(contributions)), Text.equal, Text.hash );
            let ?{stake_e8s = userNeuronStake; voting_power = userVotingPower} = contributionsMap.get(pincipal) else { continue loop_};
            totalStake += userNeuronStake; totalVotingPower += userVotingPower;
        };
        return {icp_staked = {e8s = totalStake}; voting_power = {e8s = totalVotingPower};};
    };

    public func updateUserNeuronStakeInfo(
        neuronDataMap:TreasuryTypes.NeuronsDataMap, 
        { userPrincipal: Text; newAmount: Nat64; neuronId: Text;}
    ): () {
        let neuronData = switch(neuronDataMap.get(neuronId)){
            case null { {neuron = null; neuronInfo = null; parentNeuronContributions = null; contributions = []; };};
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

        neuronStakeInfo := {neuronStakeInfo with stake_e8s = newAmount};
        contributionsMap.put(userPrincipal, neuronStakeInfo);
        neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(contributionsMap.entries())});
        computeNeuronStakeInfosVotingPowers(neuronDataMap, neuronId);
    };

    public func creditUserNeuronStake(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        {userPrincipal: Text; delta: Nat64; neuronId: Text }
    ): () {
        let userNeuronStakeInfo = getUserNeuronStakeInfo(userPrincipal, neuronDataMap, neuronId);
        updateUserNeuronStakeInfo( neuronDataMap, {userPrincipal; newAmount = userNeuronStakeInfo.stake_e8s + delta; neuronId;});
    };

    public func finalizeNewlyCreatedNeuronStakeInfo( placeHolderKey: Text, newNeuronId: Nat64, neuronDataMap: TreasuryTypes.NeuronsDataMap): () {
        let ?neuronData = neuronDataMap.remove(placeHolderKey) else { return };
        neuronDataMap.put(Nat64.toText(newNeuronId), neuronData);
    };

    public func allocateNewlySpawnedNeuronStakes(neuronDataMap: TreasuryTypes.NeuronsDataMap, neuronId: Text): () {
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
            let userStakeInNewNeuron = Float.fromInt64(Int64.fromNat64(userStakeInParentNeuron)) * (Float.fromInt64(Int64.fromNat64(newNeuronTotalStake)) / Float.fromInt64(Int64.fromNat64(parentNeuronTotalStake)));
            newNeuronContributionsMap.put(contributor, {stake_e8s = Int64.toNat64(Float.toInt64(userStakeInNewNeuron)); voting_power = 0;});
        };

        neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(newNeuronContributionsMap.entries()); parentNeuronContributions = null;});
        computeNeuronStakeInfosVotingPowers(neuronDataMap, neuronId);
    };

    public func getUserNeuronStakeInfo(userPrincipal: Text, neruonsDataMap: TreasuryTypes.NeuronsDataMap, neuronId: Text): TreasuryTypes.NeuronStakeInfo {
        let ?neuronData = neruonsDataMap.get(neuronId) else { return  { stake_e8s : Nat64 = 0; voting_power : Nat64 = 0; }; };
        let {contributions} = neuronData;
        let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
            Iter.fromArray(contributions), 
            Iter.size(Iter.fromArray(contributions)), 
            Text.equal,
            Text.hash
        );
        let ?neuronStakeInfo = contributionsMap.get(userPrincipal) else { return  { stake_e8s : Nat64 = 0; voting_power : Nat64 = 0; }; };
        return neuronStakeInfo;
    };

    public func getPrincipalAndSubaccount(
        identifier: TreasuryTypes.Identifier,
        subaccountRegistryMap: TreasuryTypes.SubaccountRegistryMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap
    ) : (Text, Account.Subaccount) {
        switch(identifier){
            case(#SubaccountId(subaccount)) {
                let ?{owner} = subaccountRegistryMap.get(subaccount) else Debug.trap("Subaccount not found.");
                return (owner, subaccount)
            };
            case(#Principal(principal)) { 
                let ?{subaccountId} = usersTreasuryDataMap.get(principal) else Debug.trap("User not found.");
                return (principal, subaccountId);
            };
        };
    };


};