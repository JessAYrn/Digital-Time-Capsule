import { round8Decimals, toHexString, fromE8s, getDateAsString, nanoSecondsToMiliSeconds } from "../functionsAndConstants/Utils";
import { sortFundingCampaigns } from "../functionsAndConstants/treasuryDataFunctions";

export const mapBalancesData = (data) => {
    const dataSorted = data.sort(function(a, b){
        const [date_a, balances_a] = a;
        const [date_b, balances_b] = b;
        const bigIntA = parseInt(date_a);
        const bigIntB = parseInt(date_b);
        if(bigIntA > bigIntB) return -1;
        else return 1
    });

    const dataMapedToUiFormat = {};
    for(let [date, balancesDataPointsObj] of dataSorted){
        const newBalancesDataPointsObj = {};
        for(let property in balancesDataPointsObj) newBalancesDataPointsObj[property] = fromE8s(parseInt(balancesDataPointsObj[property].e8s));
        dataMapedToUiFormat[getDateAsString(nanoSecondsToMiliSeconds(date))] = newBalancesDataPointsObj;
    };
    return dataMapedToUiFormat;
};

const treasuryDataToFrontendFormat = (principal, treasuryData) => {
    let {balances, automaticallyContributeToLoans, automaticallyRepayLoans} = treasuryData;
    const automaticallyContributeToLoans_ = !!automaticallyContributeToLoans.length && !!automaticallyContributeToLoans[0];
    const automaticallyRepayLoans_ = !!automaticallyRepayLoans.length && !!automaticallyRepayLoans[0];
    let {icp, icp_staked, eth, btc, voting_power} = balances;
    balances = {
        icp: parseInt(icp.e8s), 
        icp_staked: parseInt(icp_staked.e8s), 
        eth: parseInt(eth.e8s), 
        btc: parseInt(btc.e8s),
        voting_power: parseInt(voting_power.e8s)
    }; 
    return [ principal, { ...treasuryData, balances, automaticallyContributeToLoans: automaticallyContributeToLoans_, automaticallyRepayLoans: automaticallyRepayLoans_} ];
};

export const mapBackendTreasuryDataToFrontEndObj = (props) => {
    const {
        usersTreasuryDataArray,
        userTreasuryData,
        userPrincipal,
        totalDeposits,
        daoIcpAccountId,
        daoWalletBalance,
        neurons, 
        fundingCampaigns
    } = props;
    
    const daoIcpAccountId_ = toHexString(new Uint8Array( [...daoIcpAccountId]));
    const daoWalletBalance_ = parseInt(daoWalletBalance.e8s);
    const totalDeposits_ = parseInt(totalDeposits.e8s);

    const usersTreasuryDataArraySorted = usersTreasuryDataArray.sort(function(a, b){
        const [principal_a, data_a] = a;
        const [principal_b, data_b] = b;
        if(data_a?.balances?.voting_power > data_b?.balances?.voting_power) return -1;
        else return 1;
    });

    const usersTreasuryDataArray_ = usersTreasuryDataArraySorted.map( ([principal, treasuryData ]) => treasuryDataToFrontendFormat(principal, treasuryData) );
    const userTreasuryData_ = treasuryDataToFrontendFormat(userPrincipal, userTreasuryData);
    let daoTotalIcpStaked = 0;
    let votingPower = 0;
    let userVotingPower = 0;

    const userIcpNeurons = [];

    const icpNeurons = neurons.icp.map(([neuronId, {contributions, neuron, neuronInfo}]) => {
        let voting_power = neuronInfo[0]?.voting_power
        let stake_e8s = neuronInfo[0]?.stake_e8s;

        votingPower += parseInt(voting_power || 0);
        daoTotalIcpStaked += parseInt(stake_e8s || 0);
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

    return {
        usersTreasuryDataArray: usersTreasuryDataArray_, 
        daoWalletBalance: daoWalletBalance_, 
        totalDeposits: totalDeposits_,
        daoIcpAccountId: daoIcpAccountId_,
        neurons: {...neurons, icp: icpNeurons},
        daoTotalIcpStaked,
        userNeurons: {icp: userIcpNeurons},
        votingPower,
        userVotingPower,
        userTreasuryData: userTreasuryData_[1],
        userPrincipal,
        fundingCampaigns: sortFundingCampaigns(fundingCampaigns)
    };
};