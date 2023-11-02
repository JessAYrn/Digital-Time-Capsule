import TreasuryTypes "../Types/Treasury/types";
import MainTypes "types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Nat64 "mo:base/Nat64";
import Int64 "mo:base/Int64";
import NnsCyclesMinting "../Ledger/NnsCyclesMinting";


module{    


    private let nanosecondsInADay = 86_400_000_000_000;
    
    type XDRs = Float;

    public func computeTotalXdrs({ balances: TreasuryTypes.Balances; xdr_permyriad_per_icp: Nat64}): XDRs {
        let {icp} = balances;
        //will need to add more conversion methods later as more tokens are made available.
        var votingPower = Float.fromInt(Nat64.toNat(icp.e8s * xdr_permyriad_per_icp )) / Float.fromInt(Nat64.toNat(1_000_000_000_000));
        return votingPower;
    };

    public func tallyVotes({
        treasuryContributionsArray : TreasuryTypes.TreasuryContributorsArray; 
        proposal: MainTypes.Proposal;
        xdr_permyriad_per_icp: Nat64
    }) :  MainTypes.VotingResults {
        var yay: Float = 0;
        var nay: Float = 0;
        let proposalVotesHashMap = HashMap.fromIter<Text, MainTypes.Vote>(
            Iter.fromArray(proposal.votes), 
            Iter.size(Iter.fromArray(proposal.votes)), 
            Text.equal,
            Text.hash
        );

        let arrayLength = treasuryContributionsArray.size();
        var index = 0;
        while(index < arrayLength){
            let (principal, balances) = treasuryContributionsArray[index];
            let votingPower = computeTotalXdrs({ balances; xdr_permyriad_per_icp});
            let vote = proposalVotesHashMap.get(principal);
            switch(vote){
                case null {};
                case(? v){ let {adopt} = v; if(adopt) yay += votingPower else nay += votingPower; };
            };
            index += 1;
        };
        let total = yay + nay;
        return {yay; nay; total};
    };

    public func tallyAllProposalVotes({
        treasuryContributionsArray : TreasuryTypes.TreasuryContributorsArray; 
        proposals: MainTypes.ProposalsMap;
        xdr_permyriad_per_icp: Nat64
    }) : MainTypes.Proposals{

        Iter.iterate<(Nat,MainTypes.Proposal)>(
            proposals.entries(), 
            func((key, proposal) : (Nat,MainTypes.Proposal), _index) {
            let voteTally =  tallyVotes({treasuryContributionsArray; xdr_permyriad_per_icp; proposal});
            let updatedProposal = {proposal with voteTally = voteTally};
            proposals.put(key, updatedProposal);
        });
        return Iter.toArray(proposals.entries());
    };

    public func getDoesProposalRequireTreasuryContribution(action: MainTypes.ProposalActions): Bool {
        switch(action){
            case(#AddAdmin){ return true };
            case(#RemoveAdmin){ return true };
            case(#DissolveIcpNeuron){ return true };
            case(#FollowIcpNeuron){ return true };
            case(#SpawnIcpNeuron){ return true };
            case(#DispurseIcpNeuron){ return true };
            case(#ToggleCyclesSaverMode){ return true };
            case(#PurchaseCycles){ return true };
            case(#UpgradeApp){ return true };
            case(#DepositIcpToTreasury){ return false };
            case(#DepositIcpToNeuron){ return false };
        }
    };
}