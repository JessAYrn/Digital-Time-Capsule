import Account "../../Serializers/Account";
import TreasuryTypes "../Treasury/types";
import Nat64 "mo:base/Nat64";
import Ledger "../../NNS/Ledger";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import NatX "../../MotokoNumbers/NatX";
import Iter "mo:base/Iter";
import Text "mo:base/Text";

module{

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);
    let txFee: Nat64 = 10_000;

    public func performTransfer( 
        amount: Nat64, 
        from: {subaccountId: ?Account.Subaccount; accountType: TreasuryTypes.AccountType}, 
        to: { owner: Principal; subaccountId: ?Account.Subaccount; accountType: TreasuryTypes.AccountType },
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async (), 
    ): async {amountSent: Nat64;} {

        var amountSent = amount;
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

        func computeTotalStakeDepositAndVotingPower( neuronDataMap: TreasuryTypes.NeuronsDataMap, pincipal: Text ): TreasuryTypes.NeuronStakeInfo {
        
            var totalStake: Nat64 = 0;
            var totalCollateralizedStake: Nat64 = 0;
            var totalVotingPower: Nat64 = 0;

            label loop_ for((neuronId, {contributions; neuronInfo}) in neuronDataMap.entries()){

                let ?neuronInfo_ = neuronInfo else { continue loop_};
                var totalNeuronContributions: Nat64 = 0;
                for((_, {stake_e8s}) in Iter.fromArray(contributions)){ totalNeuronContributions += stake_e8s; };

                let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>( Iter.fromArray(contributions), Iter.size(Iter.fromArray(contributions)), Text.equal, Text.hash );
                let ?{stake_e8s = userContributions; voting_power; collateralized_stake_e8s} = contributionsMap.get(pincipal) else { continue loop_};

                totalStake += NatX.nat64ComputeFractionMultiplication({factor = neuronInfo_.stake_e8s; numerator = userContributions; denominator = totalNeuronContributions}); 
                totalVotingPower += voting_power; 
                totalCollateralizedStake += switch(collateralized_stake_e8s){ case null { 0; }; case(?collateralized_stake_e8s_) { collateralized_stake_e8s_; }; };
            };
            return {stake_e8s = totalStake; voting_power = totalVotingPower; collateralized_stake_e8s = ?totalCollateralizedStake;};
        };

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
}