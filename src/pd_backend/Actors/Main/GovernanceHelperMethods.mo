import TreasuryTypes "../Treasury/types";
import MainTypes "types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Nat64 "mo:base/Nat64";


module{    
    
    type XDRs = Float;

    public func tallyVotes({ neuronsDataArray: TreasuryTypes.NeuronsDataArray; proposal: MainTypes.Proposal_V2; userProfilesMap: MainTypes.UserProfilesMap_V2;}) 
    : MainTypes.VotingResults_V2 {
        var yay: Nat64 = 0;
        var nay: Nat64 = 0;

        let proposalVotesMap = HashMap.fromIter<Text, MainTypes.Vote>( Iter.fromArray(proposal.votes), Iter.size(Iter.fromArray(proposal.votes)), Text.equal, Text.hash );

        label loop_ for ((userPrincipal, userProfile) in userProfilesMap.entries()){
            let {votingPower = userVotingPower} = tallyVotingPower({neuronsDataArray; userPrincipal = Principal.toText(userPrincipal)});
            let userVoteChoice = proposalVotesMap.get(Principal.toText(userPrincipal));
            switch(userVoteChoice){ 
                case null {continue loop_};
                case(?userVoteChoice_){ if(userVoteChoice_.adopt) yay += userVotingPower else nay += userVotingPower; };
            };
        };
        
        let totalParticipated = yay + nay;
        return {yay; nay; totalParticipated};
    };

    public func tallyAllProposalVotes({ neuronsDataArray : TreasuryTypes.NeuronsDataArray; proposals: MainTypes.ProposalsMap_V2; userProfilesMap: MainTypes.UserProfilesMap_V2;}) 
    : MainTypes.Proposals_V2{

        label loop_ for((key, proposal) in proposals.entries()){
            let {finalized} = proposal;
            if(finalized) continue loop_;
            let voteTally = tallyVotes({neuronsDataArray; proposal; userProfilesMap;});
            proposals.put(key, {proposal with voteTally;});
        };
        return Iter.toArray(proposals.entries());
    };

    public func tallyVotingPower({ neuronsDataArray : TreasuryTypes.NeuronsDataArray; userPrincipal: TreasuryTypes.PrincipalAsText;})
    : {votingPower: Nat64} {
        var votingPower: Nat64 = 1;

        label loop_ for((neuronId, {contributions}) in Iter.fromArray(neuronsDataArray)){
            let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.NeuronStakeInfo>(
                Iter.fromArray(contributions), 
                Iter.size(Iter.fromArray(contributions)), 
                Text.equal,
                Text.hash
            );
            let ?{voting_power} = contributionsMap.get(userPrincipal) else continue loop_;
            votingPower += voting_power;
        };

        return {votingPower};
    };
}