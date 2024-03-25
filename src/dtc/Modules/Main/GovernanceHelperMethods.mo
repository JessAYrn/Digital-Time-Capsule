import TreasuryTypes "../../Types/Treasury/types";
import MainTypes "../../Types/Main/types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Nat64 "mo:base/Nat64";
import Int64 "mo:base/Int64";
import NnsCyclesMinting "../../NNS/NnsCyclesMinting";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";


module{    


    private let nanosecondsInADay = 86_400_000_000_000;
    
    type XDRs = Float;

    public func tallyVotes({ neuronsDataArray : TreasuryTypes.NeuronsDataArray; proposal: MainTypes.Proposal;}):
    MainTypes.VotingResults {
        var yay: Nat64 = 0;
        var nay: Nat64 = 0;
        let proposalVotesHashMap = HashMap.fromIter<Text, MainTypes.Vote>(
            Iter.fromArray(proposal.votes), 
            Iter.size(Iter.fromArray(proposal.votes)), 
            Text.equal,
            Text.hash
        );
        let neuronsDataIter = Iter.fromArray<(TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronData)>(neuronsDataArray);
        for((neuronId, neuronData) in neuronsDataIter){
            let {contributions} = neuronData;
            let neuronsStakesInfoIter = Iter.fromArray<(TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo)>(contributions);
            for((contributor, stakesInfo) in neuronsStakesInfoIter){
                let {voting_power} = stakesInfo;
                let vote = proposalVotesHashMap.get(contributor);
                switch(vote){
                    case null {};
                    case(? v){ let {adopt} = v; if(adopt) yay += voting_power else nay += voting_power; };
                };
            };
        };
        let total = yay + nay;
        return {yay; nay; total};
    };

    public func tallyAllProposalVotes({ neuronsDataArray : TreasuryTypes.NeuronsDataArray; proposals: MainTypes.ProposalsMap;}): 
    MainTypes.Proposals{

        Iter.iterate<(Nat,MainTypes.Proposal)>(
            proposals.entries(), 
            func((key, proposal) : (Nat,MainTypes.Proposal), _index) {
            let voteTally =  tallyVotes({neuronsDataArray; proposal});
            let updatedProposal = {proposal with voteTally = voteTally};
            proposals.put(key, updatedProposal);
        });
        return Iter.toArray(proposals.entries());
    };
}