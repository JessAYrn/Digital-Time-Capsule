

export const sortProposals = (proposals) => {
    const sortedProposals = proposals.sort(([proposalId_a,_], [proposalId_b, __]) => {
        if(parseInt(proposalId_a) > parseInt(proposalId_b)) return -1
        else return 1
    });
    return sortedProposals;
};