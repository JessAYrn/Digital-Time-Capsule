import { toHexString } from "../functionsAndConstants/Utils";

export const getUserTreasuryData = (userPrincipal, usersTreasuryDataArray) => {
    let userTreasuryData = usersTreasuryDataArray.find(([principal, _]) => {
        return principal === userPrincipal;
    });
    return userTreasuryData ? userTreasuryData[1] : undefined;
};

export const mapBackendTreasuryDataToFrontEndObj = (props) => {
    const {
        usersTreasuryDataArray,
        userPrincipal,
        accountId_icp,
        balance_icp,
        neurons
    } = props;
    
    const accountId_icp_ = toHexString(new Uint8Array( [...accountId_icp]));
    const balance_icp_ = parseInt(balance_icp.e8s);
    const usersTreasuryDataArray_ = usersTreasuryDataArray.map(([principal, treasuryData ]) => {
        let {deposits} = treasuryData;
        let {icp, icp_staked, eth, btc} = deposits;
        deposits = {
            icp: parseInt(icp.e8s), 
            icp_staked: parseInt(icp_staked.e8s), 
            eth: parseInt(eth.e8s), 
            btc: parseInt(btc.e8s)
        }; 
        return [ principal, { ...treasuryData, deposits} ];
    });
    let balance_icpStaked = 0;
    let votingPower = 0;
    let userVotingPower = 0;

    const userIcpNeurons = [];

    const icpNeurons = neurons.icp.map(([neuronId, {contributions, neuron, neuronInfo}]) => {
        let {voting_power, stake_e8s} = neuronInfo[0];
        votingPower += parseInt(voting_power);
        balance_icpStaked += parseInt(stake_e8s);
        let userContribution = contributions.find(([contributor, _]) => {
            return contributor === userPrincipal
        });
        let neuronData = [neuronId, {contributions, neuron: neuron[0], neuronInfo: neuronInfo[0]}];
        if(userContribution){
            userIcpNeurons.push(neuronData);
            userVotingPower += parseInt(userContribution[1].voting_power);
        };
        return neuronData;
    });

    let userTreasuryData = getUserTreasuryData(userPrincipal, usersTreasuryDataArray_);

    return {
        usersTreasuryDataArray: usersTreasuryDataArray_, 
        balance_icp: balance_icp_, 
        accountId_icp: accountId_icp_,
        neurons: {...neurons, icp: icpNeurons},
        balance_icpStaked,
        userNeurons: {icp: userIcpNeurons},
        votingPower,
        userVotingPower,
        userTreasuryData
    };
};