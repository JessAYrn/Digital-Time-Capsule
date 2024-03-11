import { toHexString } from "../functionsAndConstants/Utils";
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
    let neuronsBalance = 0;
    let userNeuronsBalance = 0;
    let votingPower = 0;
    let userVotingPower = 0;

    const userIcpNeurons = [];

    const icpNeurons = neurons.icp.map(([neuronId, {contributions, neuron, neuronInfo}]) => {
        let {voting_power, stake_e8s} = neuronInfo[0];
        votingPower += parseInt(voting_power);
        neuronsBalance += parseInt(stake_e8s);
        let userContribution = contributions.find(([contributor, _]) => {
            return contributor === userPrincipal
        });
        let neuronData = [neuronId, {contributions, neuron: neuron[0], neuronInfo: neuronInfo[0]}];
        if(userContribution){
            userIcpNeurons.push(neuronData);
            userNeuronsBalance += parseInt(userContribution[1].stake_e8s);
            userVotingPower += parseInt(userContribution[1].voting_power.e8s);
        };
        return neuronData;
    });



    return {
        usersTreasuryDataArray: usersTreasuryDataArray_, 
        balance_icp: balance_icp_, 
        accountId_icp: accountId_icp_,
        neurons: {...neurons, icp: icpNeurons},
        neuronsBalance,
        userNeurons: {icp: userIcpNeurons},
        userNeuronsBalance,
        votingPower,
        userVotingPower
    };
};