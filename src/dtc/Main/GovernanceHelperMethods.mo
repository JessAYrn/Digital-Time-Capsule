import TreasuryTypes "../Treasury/treasury.types";
import MainTypes "types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Time "mo:base/Time";
import NnsCyclesMinting "../Ledger/NnsCyclesMinting";


module{    


    private let nanosecondsInADay = 86_400_000_000_000;

    public func computeVotingPower({ contributions: TreasuryTypes.TreasuryContributions; xdr_permyriad_per_icp: Nat64}): 
    Nat64 {
        let {icp} = contributions;
        //will need to add more conversion methods later as more tokens are made available.
        var votingPower = icp * xdr_permyriad_per_icp;
        return votingPower;
    };

    public func tallyVotes({
        treasuryContributionsArray : TreasuryTypes.TreasuryContributorsArray; 
        proposal: MainTypes.Proposal;
        xdr_permyriad_per_icp: Nat64
    }) :  MainTypes.VotingResults {
        var yay: Nat64 = 0;
        var nay: Nat64 = 0;
        let proposalVotesHashMap = HashMap.fromIter<Text, MainTypes.Vote>(
            Iter.fromArray(proposal.votes), 
            Iter.size(Iter.fromArray(proposal.votes)), 
            Text.equal,
            Text.hash
        );

        let arrayLength = treasuryContributionsArray.size();
        var index = 0;
        while(index < arrayLength){
            let (principal, contributions) = treasuryContributionsArray[index];
            let votingPower = computeVotingPower({ contributions; xdr_permyriad_per_icp});
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
        proposals: MainTypes.Proposals;
        xdr_permyriad_per_icp: Nat64
    }) : MainTypes.Proposals{
        let updatedProposals = Array.map<(Nat,MainTypes.Proposal), (Nat,MainTypes.Proposal)>(
            proposals: MainTypes.Proposals, 
            func (proposalInfo: (Nat, MainTypes.Proposal)): (Nat,MainTypes.Proposal) {
                let (proposalIndex, proposal) = proposalInfo;
                let {timeInitiated} = proposal;
                if(Time.now() - timeInitiated > nanosecondsInADay * 3) return (proposalIndex, proposal);
                let voteTally =  tallyVotes({treasuryContributionsArray; xdr_permyriad_per_icp; proposal});
                let updatedProposal = {proposal with voteTally = ?voteTally};
                return (proposalIndex, updatedProposal);
        });
        return updatedProposals;
    };
}