import TreasuryTypes "../../Types/Treasury/types";
import MainTypes "../../Types/Main/types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Nat64 "mo:base/Nat64";


module{    


    private let nanosecondsInADay = 86_400_000_000_000;
    
    type XDRs = Float;

    public func tallyVotes({ 
        neuronsDataArray: TreasuryTypes.NeuronsDataArray; 
        proposal: MainTypes.Proposal; 
        founder: Text; 
        userProfilesMap: MainTypes.UserProfilesMap_V2;
    }) : MainTypes.VotingResults {
        var yay: Nat64 = 0;
        var nay: Nat64 = 0;

        let proposalVotesMap = HashMap.fromIter<Text, MainTypes.Vote>( Iter.fromArray(proposal.votes), Iter.size(Iter.fromArray(proposal.votes)), Text.equal, Text.hash );
        let foundersVoteChoice = proposalVotesMap.get(founder);

        label loop_ for ((userPrincipal, userProfile) in userProfilesMap.entries()){
            let {votingPower = userVotingPower} = tallyVotingPower({neuronsDataArray; userPrincipal = Principal.toText(userPrincipal)});
            let userVoteChoice = proposalVotesMap.get(Principal.toText(userPrincipal));
            switch(userVoteChoice){
                case null {
                    switch(foundersVoteChoice){ 
                        case null { continue loop_ }; 
                        case (?foundersVoteChoice_){ 
                            if(foundersVoteChoice_.adopt) yay += userVotingPower else nay += userVotingPower; 
                        };
                    };
                };
                case(?userVoteChoice_){ if(userVoteChoice_.adopt) yay += userVotingPower else nay += userVotingPower; };
            };
        };
        
        let total = yay + nay;
        return {yay; nay; total};
    };

    public func tallyAllProposalVotes({ 
        neuronsDataArray : TreasuryTypes.NeuronsDataArray; 
        proposals: MainTypes.ProposalsMap;
        founder: Text; 
        userProfilesMap: MainTypes.UserProfilesMap_V2;
    }) : MainTypes.Proposals{

        label loop_ for((key, proposal) in proposals.entries()){
            let {timeVotingPeriodEnds} = proposal;
            if(Time.now() > timeVotingPeriodEnds + nanosecondsInADay) continue loop_;
            let voteTally = tallyVotes({neuronsDataArray; proposal; founder; userProfilesMap});
            proposals.put(key, {proposal with voteTally;});
        };
        return Iter.toArray(proposals.entries());
    };

    public func tallyVotingPower({ 
        neuronsDataArray : TreasuryTypes.NeuronsDataArray;
        userPrincipal: TreasuryTypes.PrincipalAsText;
    }): {votingPower: Nat64} {
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

    public func isInstallUpgradeProposalIsActive( proposals: MainTypes.ProposalsMap ): Bool {
        label loop_ for((_, proposal) in proposals.entries()){
            let {timeVotingPeriodEnds} = proposal;
            if(Time.now() > timeVotingPeriodEnds) continue loop_;
            let {action} = proposal;
            switch(action){ case (#InstallUpgrades(_)) { return true; }; case(_) { continue loop_; }; };
        };
        return false;
    };
}