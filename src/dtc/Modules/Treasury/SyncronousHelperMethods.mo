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

    public func userHasSufficientStake(userPrincipal: Principal, usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, minimalRequiredVotingPower: Nat64): 
    Bool {
        let userTreasuryData = usersTreasuryDataMap.get(userPrincipal);
        switch(userTreasuryData){
            case null { return false};
            case (?userTreasuryData_){
                var totalVotingPower : Nat64 = 0;
                let icpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(userTreasuryData_.neurons.icp);
                for( neuronStake in icpNeuronsStakesIter){
                    let {voting_power} = neuronStake.1;
                    totalVotingPower += voting_power;
                };
                if(totalVotingPower < minimalRequiredVotingPower) return false;
                return true;
            };
        };
    };  

    public func updateUserTreasruyDeposits(
        usersTreasuryData: TreasuryTypes.UsersTreasuryDataMap, 
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Principal; currency : TreasuryTypes.SupportedCurrencies; newAmount: Nat64;}): 
    () {
        let treasuryData = usersTreasuryData.get(userPrincipal);
        var updatedTreasuryData = switch(treasuryData){
            case null { 
                {
                    neurons = {icp = [] };
                    deposits = {
                        icp = {e8s: Nat64 = 0 }; 
                        icp_staked = {e8s: Nat64 = 0 };
                        eth = {e8s: Nat64 = 0 };
                        btc = {e8s: Nat64 = 0 };
                    }; 
                };
            };
            case(?treasuryData_){ treasuryData_ };
        };
        switch(currency) {
            case(#Icp){ updatedTreasuryData := {updatedTreasuryData with deposits = {updatedTreasuryData.deposits with icp = {e8s = newAmount}}}};
            case(#Icp_staked){ updatedTreasuryData := {updatedTreasuryData with deposits = {updatedTreasuryData.deposits with icp_staked = {e8s = newAmount}}}};
            case(#Eth){ updatedTreasuryData := {updatedTreasuryData with deposits = {updatedTreasuryData.deposits with eth = {e8s = newAmount}}}};
            case(#Btc){ updatedTreasuryData := {updatedTreasuryData with deposits = {updatedTreasuryData.deposits with btc = {e8s = newAmount}}}};
        };

        usersTreasuryData.put(userPrincipal, updatedTreasuryData);
        let timerId = setTimer(#seconds(1), func () : async () { await updateTokenBalances()});
    };

    public func computeNeuronStakeInfosVotingPowers(
        neuronDataMap:TreasuryTypes.NeuronsDataMap, 
        usersTreasuryDataMap:TreasuryTypes.UsersTreasuryDataMap,
        neuronId: Text
    ): () {
        let ?neuronData = neuronDataMap.get(neuronId) else { return };
        let ?neuronInfo = neuronData.neuronInfo else { return };
        let {stake_e8s = neuronTotalStake; voting_power = neuronTotalVotingPower; } = neuronInfo;

        for((userPrincipal, userTreasuryData) in usersTreasuryDataMap.entries()){
            let userIcpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(userTreasuryData.neurons.icp);
            let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                userIcpNeuronsStakesIter, 
                Iter.size(Iter.fromArray(userTreasuryData.neurons.icp)), 
                Text.equal,
                Text.hash
            );
            switch(userIcpNeuronsStakesMap.get(neuronId)){
                case(null){};
                case(?userIcpNeuronStake){
                    let {stake_e8s = userTotalStake} = userIcpNeuronStake;
                    let userVotingPower = (userTotalStake * neuronTotalVotingPower) / neuronTotalStake;
                    userIcpNeuronsStakesMap.put(neuronId, {userIcpNeuronStake with voting_power = userVotingPower});
                    usersTreasuryDataMap.put(userPrincipal, {userTreasuryData with neurons = {userTreasuryData.neurons with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())}});
                };
            };
        };
    };

    public func updateUserNeuronStakeInfo(
        neuronDataMap:TreasuryTypes.NeuronsDataMap, 
        usersTreasuryDataMap:TreasuryTypes.UsersTreasuryDataMap,
        { userPrincipal: Principal; newAmount: Nat64; neuronId: Text;}
    ): () {
        let userTreasuryData = switch(usersTreasuryDataMap.get(userPrincipal)){
            case null { 
                { 
                    neurons = {icp = [] };
                    deposits = {
                        icp = {e8s : Nat64 = 0};
                        icp_staked = {e8s : Nat64 = 0};
                        eth = {e8s : Nat64 = 0};
                        btc = {e8s : Nat64 = 0};
                    };
                } 
            }; 
            case(?userTreasuryData_){ userTreasuryData_ } };
        let {neurons} = userTreasuryData;
        let userIcpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(neurons.icp);
        let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
            userIcpNeuronsStakesIter, 
            Iter.size(Iter.fromArray(neurons.icp)), 
            Text.equal,
            Text.hash
        );
        var userIcpNeuronStake = switch(userIcpNeuronsStakesMap.get(neuronId)){
            case null { {stake_e8s : Nat64 = 0; voting_power : Nat64 = 0;} };
            case(?icpNeuronStake_){ icpNeuronStake_ };
        };
        userIcpNeuronStake := {userIcpNeuronStake with stake_e8s = newAmount};
        userIcpNeuronsStakesMap.put(neuronId, userIcpNeuronStake);
        usersTreasuryDataMap.put(userPrincipal, {userTreasuryData with neurons = {neurons with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())}});
        computeNeuronStakeInfosVotingPowers(neuronDataMap, usersTreasuryDataMap, neuronId);
    };

    public func creditUserNeuronStake(
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap,
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Principal; delta: Nat64; neuronId: Text }
    ): () {
        let treasuryData = switch(usersTreasuryDataMap.get(userPrincipal)){
            case(?treasuryData_){ treasuryData_ };
            case null { 
                { 
                    neurons = {icp = [] };
                    deposits ={
                        icp = {e8s : Nat64 = 0};
                        icp_staked = {e8s : Nat64 = 0};
                        eth = {e8s : Nat64 = 0};
                        btc = {e8s : Nat64 = 0};
                    } ;
                };
            };
        };
        updateUserTreasruyDeposits(usersTreasuryDataMap,updateTokenBalances, {userPrincipal; currency = #Icp_staked; newAmount = treasuryData.deposits.icp_staked.e8s + delta});
        let userNeuronStakeInfo = getUserNeuronStakeInfo(userPrincipal, usersTreasuryDataMap, neuronId);
        updateUserNeuronStakeInfo( neuronDataMap, usersTreasuryDataMap, {userPrincipal; newAmount = userNeuronStakeInfo.stake_e8s + delta; neuronId;});
    };

    public func getUserNeuronStakeInfo(userPrincipal: Principal,usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, neuronId: Text): TreasuryTypes.NeuronStakeInfo {
        let userStakes = usersTreasuryDataMap.get(userPrincipal);
        switch(userStakes){
            case null { return  { stake_e8s : Nat64 = 0; voting_power : Nat64 = 0; }; };
            case (?userTreasuryData){
                let icpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(userTreasuryData.neurons.icp);
                let icpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                    icpNeuronsStakesIter, 
                    Iter.size(Iter.fromArray(userTreasuryData.neurons.icp)), 
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

    public func creditUserIcpDeposits(
        usersTreasuryData: TreasuryTypes.UsersTreasuryDataMap,
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Principal; amount: Nat64}): () {
        let treasuryData = switch(usersTreasuryData.get(userPrincipal)){
            case null { 
                {
                    neurons = {icp = [] };
                    deposits ={
                        icp = {e8s: Nat64 = 0}; 
                        icp_staked = {e8s: Nat64 = 0};
                        eth = {e8s: Nat64 = 0};
                        btc = {e8s: Nat64 = 0};
                    }; 
                };
            };
            case(?treasuryData_){ treasuryData_ };
        };
        updateUserTreasruyDeposits(usersTreasuryData,updateTokenBalances, {userPrincipal; currency = #Icp; newAmount = treasuryData.deposits.icp.e8s + amount});
    };

    public func debitUserIcpDeposits(
        usersTreasuryData: TreasuryTypes.UsersTreasuryDataMap,
        updateTokenBalances: shared () -> async (),
        {userPrincipal: Principal; amount: Nat64}): () {
        let ?treasuryData = usersTreasuryData.get(userPrincipal) else Debug.trap("No deposits for contributor");
        if(treasuryData.deposits.icp.e8s < amount) { Debug.trap("Insufficient deposit amount."); };
        updateUserTreasruyDeposits(usersTreasuryData, updateTokenBalances, {userPrincipal; currency = #Icp; newAmount = treasuryData.deposits.icp.e8s - amount});
    };

    public func finalizeNewlyCreatedNeuronStakeInfo(
        placeHolderKey: Text,  
        newNeuronId: Nat64,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap
    ): () {
        for((userPrincipal, userTreasuryData) in usersTreasuryDataMap.entries()){
            let userIcpNeuronsStakesIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo)>(userTreasuryData.neurons.icp);
            let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                userIcpNeuronsStakesIter, 
                Iter.size(Iter.fromArray(userTreasuryData.neurons.icp)), 
                Text.equal,
                Text.hash
            );
            switch(userIcpNeuronsStakesMap.get(placeHolderKey)){
                case(null){};
                case(?newNeuronStakeInfo){
                    userIcpNeuronsStakesMap.put(Nat64.toText(newNeuronId), newNeuronStakeInfo);
                    let _ = userIcpNeuronsStakesMap.remove(placeHolderKey);
                    usersTreasuryDataMap.put(userPrincipal, {userTreasuryData with neurons = {userTreasuryData.neurons with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())}});
                };
            };
        };
    };

    public func splitNeuronStakeInfo(
        sourceNeuronId: Nat64, 
        targetNeuronId: Nat64, 
        splitAmount: Nat64,
        proposer: Principal,
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap, 
        neuronDataMap: TreasuryTypes.NeuronsDataMap,
    ): () {
        let ?{neuron; neuronInfo} = neuronDataMap.get(Nat64.toText(sourceNeuronId)) else { Debug.trap("No neuronData for neuronId") };
        let ?neuronStakeInfo_ = neuronInfo else { Debug.trap("No neuronInfo for neuronId") };
        let {stake_e8s = oldNeuronTotalStake} = neuronStakeInfo_;
        var splitAmount_: Nat64 = 0;

        label splitLoop for((userPrincipal, userTreasuryData) in usersTreasuryDataMap.entries()){
            let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                Iter.fromArray(userTreasuryData.neurons.icp), 
                Iter.size(Iter.fromArray(userTreasuryData.neurons.icp)), 
                Text.equal,
                Text.hash
            );
            let ?oldNeuronStakeInfo = userIcpNeuronsStakesMap.get(Nat64.toText(sourceNeuronId)) else {continue splitLoop};
            let {stake_e8s = oldNeuronStake} = oldNeuronStakeInfo;
            let newNeuronStake = (oldNeuronStake * splitAmount) / oldNeuronTotalStake;
            splitAmount_ += newNeuronStake;
            var updatedOldNeuronStake = oldNeuronStake - newNeuronStake;
            if(userPrincipal == proposer) { updatedOldNeuronStake -= txFee; };
            userIcpNeuronsStakesMap.put(Nat64.toText(sourceNeuronId), {oldNeuronStakeInfo with stake_e8s = updatedOldNeuronStake});
            userIcpNeuronsStakesMap.put(Nat64.toText(targetNeuronId), {stake_e8s = newNeuronStake; voting_power = 0});
            usersTreasuryDataMap.put(userPrincipal, {userTreasuryData with neurons = {userTreasuryData.neurons with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())}});
        };

        var slippage = splitAmount - splitAmount_;
        var index = 0;
        var remainingSlippage = slippage;
        label slippageOutterLoop while(slippage > 0){
            label slippageInnerLoop for((userPrincipal, userTreasuryData) in usersTreasuryDataMap.entries()){
                if(slippage <= 0) break slippageOutterLoop;
                let userIcpNeuronsStakesMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronStakeInfo>(
                    Iter.fromArray(userTreasuryData.neurons.icp), 
                    Iter.size(Iter.fromArray(userTreasuryData.neurons.icp)), 
                    Text.equal,
                    Text.hash
                );
                let ?oldNeuronStakeInfo = userIcpNeuronsStakesMap.get(Nat64.toText(sourceNeuronId)) else {continue slippageInnerLoop};
                let ?newNeuronStakeInfo = userIcpNeuronsStakesMap.get(Nat64.toText(targetNeuronId)) else {continue slippageInnerLoop};
                userIcpNeuronsStakesMap.put(Nat64.toText(sourceNeuronId), {oldNeuronStakeInfo with stake_e8s = oldNeuronStakeInfo.stake_e8s - 1});
                userIcpNeuronsStakesMap.put(Nat64.toText(targetNeuronId), {newNeuronStakeInfo with stake_e8s = newNeuronStakeInfo.stake_e8s + 1;});
                usersTreasuryDataMap.put(userPrincipal, {userTreasuryData with neurons = {userTreasuryData.neurons with icp = Iter.toArray(userIcpNeuronsStakesMap.entries())}});
                slippage -= 1;
            };
            if (remainingSlippage == slippage) { break slippageOutterLoop; };
            remainingSlippage := slippage;
        };
        computeNeuronStakeInfosVotingPowers(neuronDataMap, usersTreasuryDataMap, Nat64.toText(sourceNeuronId));
        computeNeuronStakeInfosVotingPowers(neuronDataMap, usersTreasuryDataMap, Nat64.toText(targetNeuronId));
    };


};