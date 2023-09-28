import TreasuryTypes "../Treasury/treasury.types";
import MainTypes "types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import NnsCyclesMinting "../Ledger/NnsCyclesMinting";

module{

    public type VotingResults = {
        yay: Nat64;
        nay: Nat64;
        total: Nat64;
    };

    

    public func computeVotingPower({ contributions: TreasuryTypes.TreasuryContributions; xdr_permyriad_per_icp: Nat64}): 
    Nat64 {
        let {icp} = contributions;
        //will need to add more conversion methods later as more tokens are made available.
        var votingPower = icp * xdr_permyriad_per_icp;
        return votingPower;
    };

    public func tallyVotes({treasuryContributionsArray : TreasuryTypes.TreasuryContributorsArray; proposal: MainTypes.Proposal}) : 
    async VotingResults {
        var yay: Nat64 = 0;
        var nay: Nat64 = 0;
        let proposalVotesHashMap = HashMap.fromIter<Principal, MainTypes.Vote>(
            Iter.fromArray(proposal.votes), 
            Iter.size(Iter.fromArray(proposal.votes)), 
            Principal.equal,
            Principal.hash
        );

        let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
        let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
        let {xdr_permyriad_per_icp} = data;

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
}