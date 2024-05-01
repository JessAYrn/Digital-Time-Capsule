import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import TreasuryTypes "../../Types/Treasury/types";

module{

    let {setTimer} = Timer;

    let txFee: Nat64 = 10_000; 

    public func updateUserTreasruyDeposits(
        usersTreasuryData: TreasuryTypes.UsersTreasuryDataMap, 
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Text; currency : TreasuryTypes.SupportedCurrencies; newAmount: Nat64;}): 
    () {
        let treasuryData = usersTreasuryData.get(userPrincipal);
        var updatedTreasuryData = switch(treasuryData){
            case null { 
                {
                    deposits = {
                        icp = {e8s: Nat64 = 0 }; 
                        eth = {e8s: Nat64 = 0 };
                        btc = {e8s: Nat64 = 0 };
                    }; 
                };
            };
            case(?treasuryData_){ treasuryData_ };
        };
        switch(currency) {
            case(#Icp){ updatedTreasuryData := {updatedTreasuryData with deposits = {updatedTreasuryData.deposits with icp = {e8s = newAmount}}}};
            case(#Eth){ updatedTreasuryData := {updatedTreasuryData with deposits = {updatedTreasuryData.deposits with eth = {e8s = newAmount}}}};
            case(#Btc){ updatedTreasuryData := {updatedTreasuryData with deposits = {updatedTreasuryData.deposits with btc = {e8s = newAmount}}}};
        };

        usersTreasuryData.put(userPrincipal, updatedTreasuryData);
        let timerId = setTimer(#seconds(1), func () : async () { await updateTokenBalances()});
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
        for((contributor, neuronStakeInfo) in contributionsMap.entries()){
            let {stake_e8s = userTotalStake} = neuronStakeInfo;
            let userVotingPower = (userTotalStake * neuronTotalVotingPower) / neuronTotalStake;
            contributionsMap.put(contributor, {neuronStakeInfo with voting_power = userVotingPower});
            neuronDataMap.put(neuronId, {neuronData with contributions = Iter.toArray(contributionsMap.entries())});
        };
    };

    public func computeTotalStakeDeposit(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        pincipal: Text
    ): Nat64 {
        var totalStake: Nat64 = 0;
        label loop_ for((neuronId, {contributions}) in neuronDataMap.entries()){
            let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
                Iter.fromArray(contributions), 
                Iter.size(Iter.fromArray(contributions)), 
                Text.equal,
                Text.hash
            );
            let ?{stake_e8s} = contributionsMap.get(pincipal) else { continue loop_};
            totalStake += stake_e8s;
        };
        return totalStake;
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

    public func creditUserIcpDeposits(
        usersTreasuryData: TreasuryTypes.UsersTreasuryDataMap,
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Text; amount: Nat64}): () {
        let treasuryData = switch(usersTreasuryData.get(userPrincipal)){
            case null { { deposits ={ icp = {e8s: Nat64 = 0}; eth = {e8s: Nat64 = 0}; btc = {e8s: Nat64 = 0}; }; }; };
            case(?treasuryData_){ treasuryData_ };
        };
        updateUserTreasruyDeposits(usersTreasuryData,updateTokenBalances, {userPrincipal; currency = #Icp; newAmount = treasuryData.deposits.icp.e8s + amount});
    };

    public func debitUserIcpDeposits(
        usersTreasuryData: TreasuryTypes.UsersTreasuryDataMap,
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Text; amount: Nat64}): () {
        let ?treasuryData = usersTreasuryData.get(userPrincipal) else Debug.trap("No deposits for contributor");
        if(treasuryData.deposits.icp.e8s < amount) { Debug.trap("Insufficient deposit amount."); };
        updateUserTreasruyDeposits(usersTreasuryData, updateTokenBalances, {userPrincipal; currency = #Icp; newAmount = treasuryData.deposits.icp.e8s - amount});
    };

    public func finalizeNewlyCreatedNeuronStakeInfo(
        placeHolderKey: Text,  
        newNeuronId: Nat64,
        neuronDataMap: TreasuryTypes.NeuronsDataMap
    ): () {
        let ?neuronData = neuronDataMap.remove(placeHolderKey) else { return };
        neuronDataMap.put(Nat64.toText(newNeuronId), neuronData);
    };

    public func splitNeuronStakeInfo(
        sourceNeuronId: Nat64, 
        targetNeuronId: Nat64, 
        splitAmount: Nat64,
        proposer: Text,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, 
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
    ): () {
        let ?neuronData = neuronDataMap.get(Nat64.toText(sourceNeuronId)) else { Debug.trap("No neuronData for neuronId") };
        let ?neuronInfo = neuronData.neuronInfo else { Debug.trap("No neuronInfo for neuronId") };
        let {contributions} = neuronData;
        let sourceNeuronContributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
            Iter.fromArray(contributions), 
            Iter.size(Iter.fromArray(contributions)), 
            Text.equal,
            Text.hash
        );
        let targetNeuronContributionsMap = HashMap.HashMap<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(1, Text.equal, Text.hash);
        
        let {stake_e8s = sourceNeuronTotalStake} = neuronInfo;
        var splitAmount_: Nat64 = 0;

        label splitLoop for((userPrincipal, neuronStakeInfo) in sourceNeuronContributionsMap.entries()){
            let {stake_e8s = sourceNeuronStake} = neuronStakeInfo;
            let targetNeuronStake = (sourceNeuronStake * splitAmount) / sourceNeuronTotalStake;
            splitAmount_ += targetNeuronStake;
            var updatedSourceNeuronStake = sourceNeuronStake - targetNeuronStake;
            if(userPrincipal == proposer) { updatedSourceNeuronStake -= txFee; };

            sourceNeuronContributionsMap.put(userPrincipal, {neuronStakeInfo with stake_e8s = updatedSourceNeuronStake});
            targetNeuronContributionsMap.put(userPrincipal, {stake_e8s = targetNeuronStake ; voting_power = 0;});
        };

        var slippage = splitAmount - splitAmount_;

        label slippageOutterLoop while(slippage > 0){
            label slippageInnerLoop for((userPrincipal, sourceNeuronStakeInfo) in sourceNeuronContributionsMap.entries()){
                let ?targetNeuronStakeInfo = targetNeuronContributionsMap.get(userPrincipal) else { continue slippageInnerLoop };
                sourceNeuronContributionsMap.put(userPrincipal, {sourceNeuronStakeInfo with stake_e8s = sourceNeuronStakeInfo.stake_e8s - 1});
                targetNeuronContributionsMap.put(userPrincipal, {targetNeuronStakeInfo with stake_e8s = targetNeuronStakeInfo.stake_e8s + 1});
                slippage -= 1;
                if(slippage <= 0) break slippageInnerLoop;
            };
        };

        neuronDataMap.put(Nat64.toText(sourceNeuronId), {neuronData with contributions = Iter.toArray(sourceNeuronContributionsMap.entries())});
        neuronDataMap.put(Nat64.toText(targetNeuronId), {contributions = Iter.toArray(targetNeuronContributionsMap.entries()); neuron = null; neuronInfo = null; parentNeuronContributions = null});

        computeNeuronStakeInfosVotingPowers(neuronDataMap, Nat64.toText(sourceNeuronId));
        computeNeuronStakeInfosVotingPowers(neuronDataMap, Nat64.toText(targetNeuronId));
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
        for((contributor, neuronStakeInfo) in parentNeuronContributionsMap.entries()){
            let {stake_e8s = userTotalStake} = neuronStakeInfo;
            parentNeuronTotalStake += userTotalStake;
        };

        let {contributions} = neuronData;
        let newNeuronContributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
            Iter.fromArray(contributions), 
            Iter.size(Iter.fromArray(contributions)), 
            Text.equal,
            Text.hash
        );

        for((contributor, neuronStakeInfo) in parentNeuronContributionsMap.entries()){
            let {stake_e8s = userTotalStakeInParentNeuron} = neuronStakeInfo;
            let userStakeInNewNeuron = (userTotalStakeInParentNeuron * newNeuronTotalStake) / parentNeuronTotalStake;
            newNeuronContributionsMap.put(contributor, {stake_e8s = userStakeInNewNeuron; voting_power = 0;});
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

    public func creditUsersForDispursedNeuron(
        neuronDataMap: TreasuryTypes.NeuronsDataMap, 
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, 
        updateTokenBalances: shared () -> async (), 
        neuronId: Text,
        proposer: Text
    ): () {
        let ?neuronData = neuronDataMap.get(neuronId) else { return };
        let {contributions} = neuronData;
        
        label loop_ for((userPrincipal, neuronStakeInfo) in Iter.fromArray(contributions)){
            var userStake = neuronStakeInfo.stake_e8s;
            if(userPrincipal == proposer) { userStake -= txFee; };
            creditUserIcpDeposits(usersTreasuryDataMap, updateTokenBalances, {userPrincipal; amount = userStake});
        };
        let ?neuronData_ = neuronDataMap.remove(neuronId) else { return };
    };


};