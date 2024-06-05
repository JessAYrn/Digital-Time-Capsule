import { round8Decimals, toHexString } from "../functionsAndConstants/Utils";

import { nanoSecondsToMiliSeconds, getDateAsStringMMDDYYY, fromE8s, shortenHexString } from "../functionsAndConstants/Utils";
import { GRAPH_DISPLAY_LABELS, GRAPH_DATA_SETS } from "../functionsAndConstants/Constants";

const dummyLabels = [
    getDateAsStringMMDDYYY(Date.now() - (1000 * 60 * 60 * 24 * 6)),
    getDateAsStringMMDDYYY(Date.now() - (1000 * 60 * 60 * 24 * 5)),
    getDateAsStringMMDDYYY(Date.now() - (1000 * 60 * 60 * 24 * 4)),
    getDateAsStringMMDDYYY(Date.now() - (1000 * 60 * 60 * 24 * 3)),
    getDateAsStringMMDDYYY(Date.now() - (1000 * 60 * 60 * 24 * 2)),
    getDateAsStringMMDDYYY(Date.now() - (1000 * 60 * 60 * 24 * 1)),
    getDateAsStringMMDDYYY(Date.now() - (1000 * 60 * 60 * 24 * 0))
];

const dummyData = {data: [0,0,0,0,0,0,0], fill: false,radius: 2, boarderWidth: 0.5};


const dummyDataset = 
    {
        labels: dummyLabels, 
        datasets: [
        {...dummyData, label: GRAPH_DISPLAY_LABELS.icp },
        {...dummyData, label: GRAPH_DISPLAY_LABELS.btc },
        {...dummyData, label: GRAPH_DISPLAY_LABELS.eth },
        {...dummyData, label: GRAPH_DISPLAY_LABELS.icp_staked }
    ]}


export const dummyDataSets = {
    week: dummyDataset,
    month: dummyDataset,
    year: dummyDataset,
    allTime: dummyDataset
};

const parseBigIntsFromBalances = (balances) => {
    let currencies = Object.keys(balances);
    currencies.forEach(currency => {
        let balance = (balances[currency]?.e8s !== undefined) ?  balances[currency]?.e8s : balances[currency];
        balances[currency] = fromE8s(parseInt(balance));
    });
    return balances;
}

const getLabels = (data) => {return data.map(([date, balances]) => {return date})};
const getDataSet = (data_, currency) => {
    const data = data_.map(([date, balances]) => {
        return balances[currency]?.e8s || balances[currency]
    });
    const label = currency.toUpperCase();
    const radius = 2;
    const boarderWidth = 0.5;
    const pointHoverRadius = 5;
    return {data, label, radius, boarderWidth, pointHoverRadius};
};
const getDataSets = (data_) => {
    let currencies = Object.keys(data_[0][1]);
    let datasets = [];
    currencies.forEach(currency => { 
        const set = getDataSet(data_, currency);
        datasets.push(set);
    });
    return datasets;
};

export const mapBalancesDataFromApiToFrontend = (data) => {
    const data_ = data.sort(function(a, b){
        const [date_a, balances_a] = a;
        const [date_b, balances_b] = b;
        const bigIntA = parseInt(date_a);
        const bigIntB = parseInt(date_b);
        if(bigIntA > bigIntB) return 1;
        else return -1
    });
    let length = data_.length;
    if(!length) return dummyDataSets;
    const week_dataset = [];
    const month_dataset = [];
    const year_dataset = [];
    const allTime_dataset= [];
    data_.forEach(([date, balances], index) => {
        date = parseFloat(date);
        date = nanoSecondsToMiliSeconds(date);
        date = getDateAsStringMMDDYYY(date);
        let coordinate = [date, parseBigIntsFromBalances(balances)];
        if(length - index < 365) year_dataset.push(coordinate);
        if(length - index < 30) month_dataset.push(coordinate);
        if(length - index < 7) week_dataset.push(coordinate);
        allTime_dataset.push(coordinate);
        
    });
    const week = {labels: getLabels(week_dataset), datasets: getDataSets(week_dataset)};
    const month = {labels: getLabels(month_dataset), datasets: getDataSets(month_dataset) };
    const year = {labels: getLabels(year_dataset), datasets: getDataSets(year_dataset)};
    const allTime = {labels: getLabels(allTime_dataset), datasets: getDataSets(allTime_dataset)}

    return {week, month, year, allTime};
};

const getLabels_neuronContributions = (data) => {return data.map(([contributor, contributions]) => {return shortenHexString(contributor)})};

const getDataSet_neuronContributionsStake = (data_) => {
    const data_stake_e8s = data_.map(([contributor, contributions]) => {
        return fromE8s(parseInt(contributions.stake_e8s));
    });
    const label = "Stake";
    const radius = 125;
    const boarderWidth = 0.5;
    const pointHoverRadius = 5;
    return {data: data_stake_e8s, label, boarderWidth, pointHoverRadius, radius};
};

const getDataSet_neuronContributionsVotingPower = (data_) => {
    const data_voting_power = data_.map(([contributor, contributions]) => {
        return fromE8s(parseInt(contributions.voting_power));
    });
    const label = "Voting Power";
    const radius = 125;
    const boarderWidth = 0.5;
    const pointHoverRadius = 5;
    return {data: data_voting_power, label, boarderWidth, pointHoverRadius, radius};
};

export const mapNeuronContributionsDataToChartFormat = (data) => {

    const neuronStakeData = {
        labels: getLabels_neuronContributions(data), 
        datasets: [
            getDataSet_neuronContributionsVotingPower(data),
            getDataSet_neuronContributionsStake(data)
        ], 
        circumference: 2, 
        radius: 2
    };
    return {
        [GRAPH_DATA_SETS.neuronContributions]: neuronStakeData,
    };
};

export const neuronContributionsTableColumns = [
    { 
        field: 'userPrincipal', 
        headerName: 'Principal ID', 
        width: 150,
        editable: false
    },
    { 
        field: 'stake_e8s', 
        headerName: 'Stake', 
        width: 200,
        editable: false
    },
    { 
        field: 'voting_power', 
        headerName: 'Voting Power', 
        width: 200,
        editable: false
    },
];

export const mapNeuronContributionsToTableRows = (neuronContributions) => {
    const neuronContributions_ = neuronContributions.map(([userPrincipal, {stake_e8s, voting_power}]) => {
        return {
            id: userPrincipal,
            userPrincipal: shortenHexString(userPrincipal),
            stake_e8s: round8Decimals(fromE8s(parseInt(stake_e8s))),
            voting_power: round8Decimals(fromE8s(parseInt(voting_power)))
        }
    });
    return neuronContributions_;
}

export const getUserTreasuryData = (userPrincipal, usersTreasuryDataArray) => {
    let userTreasuryData = usersTreasuryDataArray.find(([principal, _]) => {
        return principal === userPrincipal;
    });
    return userTreasuryData ? userTreasuryData[1] : undefined;
};

export const getUserNeuronContribution = (userPrincipal, neuronContributions) => {
    let userContribution = neuronContributions.find(([contributor, _]) => {
        return contributor === userPrincipal;
    });
    return userContribution ? userContribution[1] : {stake_e8s: 0, voting_power: 0};
};

export const mapBackendTreasuryDataToFrontEndObj = (props) => {
    const {
        usersTreasuryDataArray,
        userPrincipal,
        totalDeposits,
        accountId_icp,
        balance_icp,
        neurons
    } = props;
    
    const accountId_icp_ = toHexString(new Uint8Array( [...accountId_icp]));
    const balance_icp_ = parseInt(balance_icp.e8s);
    const totalDeposits_ = parseInt(totalDeposits.e8s);
    const daoTotalProfit = balance_icp_ - totalDeposits_;
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
        console.log(neuronInfo);
        let voting_power = neuronInfo[0]?.voting_power
        let stake_e8s = neuronInfo[0]?.stake_e8s;

        votingPower += parseInt(voting_power || 0);
        balance_icpStaked += parseInt(stake_e8s || 0);
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
        totalDeposits: totalDeposits_,
        daoTotalProfit,
        accountId_icp: accountId_icp_,
        neurons: {...neurons, icp: icpNeurons},
        balance_icpStaked,
        userNeurons: {icp: userIcpNeurons},
        votingPower,
        userVotingPower,
        userTreasuryData,
        userPrincipal
    };
};