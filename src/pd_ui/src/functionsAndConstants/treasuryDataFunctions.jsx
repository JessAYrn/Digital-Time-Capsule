export const getUserNeuronContribution = (userPrincipal, neuronContributions) => {
    let userContribution = neuronContributions.find(([contributor, _]) => {
        return contributor === userPrincipal;
    });
    return userContribution ? userContribution[1] : {stake_e8s: 0, voting_power: 0, collateralized_stake_e8s: [0]};
};

export const getUserNeuronContributionFromNeuronId = (userPrincipal, neuronId, neuronsDataArray) => {
    const [_, neuronData] = neuronsDataArray.find(([id, _]) => { return id === neuronId; });
    return getUserNeuronContribution(userPrincipal, neuronData?.contributions);
};

export const getTotalContributions = (neuronContributionsArray) => {
    let total = 0;
    for(const [_, contribution] of neuronContributionsArray) total += parseInt(contribution.stake_e8s);
    return total;
};

export const getUncollateralizedStake = (userPrincipal, neuronId, neuronsDataArray) => {
    const userContribution = getUserNeuronContributionFromNeuronId(userPrincipal, neuronId, neuronsDataArray);
    return parseInt(userContribution.stake_e8s) - (parseInt(userContribution.collateralized_stake_e8s[0] || 0));
};

export const sortFundingCampaigns = (fundingCampaigns) => {
    const sortedFundingCampaigns = fundingCampaigns.sort(([campaignId_a, _], [campaignId_b, __]) => {
        if(parseInt(campaignId_a) > parseInt(campaignId_b)) return -1
        else return 1
    });
    return sortedFundingCampaigns;
};
