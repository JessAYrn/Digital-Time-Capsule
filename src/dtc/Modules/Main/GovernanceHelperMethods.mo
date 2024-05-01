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

    public func tallyVotes({ neuronsDataArray: TreasuryTypes.NeuronsDataArray; proposal: MainTypes.Proposal; }):
    MainTypes.VotingResults {
        var yay: Nat64 = 0;
        var nay: Nat64 = 0;

        for(vote in Iter.fromArray(proposal.votes)){
            let (principalId, {adopt}) = vote;
            var votingPower: Nat64 = 1;
            label innerLoop for((neuronId, {contributions}) in Iter.fromArray(neuronsDataArray)){
                let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
                    Iter.fromArray(contributions), 
                    Iter.size(Iter.fromArray(contributions)), 
                    Text.equal,
                    Text.hash
                );
                let ?{voting_power} = contributionsMap.get(principalId) else continue innerLoop;
                votingPower += voting_power;
            };
            if(adopt) yay += votingPower else nay += votingPower;
        };
        
        let total = yay + nay;
        return {yay; nay; total};
    };

    public func tallyAllProposalVotes({ neuronsDataArray : TreasuryTypes.NeuronsDataArray; proposals: MainTypes.ProposalsMap;}): 
    MainTypes.Proposals{

        for((key, proposal) in proposals.entries()){
            let voteTally = tallyVotes({neuronsDataArray; proposal});
            proposals.put(key, {proposal with voteTally;});
        };
        return Iter.toArray(proposals.entries());
    };
}