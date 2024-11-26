import { round8Decimals, toHexString } from "../functionsAndConstants/Utils";
import { nanoSecondsToMiliSeconds, getDateAsStringMMDDYYY, fromE8s, shortenHexString } from "../functionsAndConstants/Utils";
import { GRAPH_DISPLAY_LABELS, GRAPH_DATA_SETS } from "../functionsAndConstants/Constants";
import { sortFundingCampaigns } from "../functionsAndConstants/treasuryDataFunctions";

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

const getDataSetsForChartFromDataMap = (data, radius) => {
    let keys = Object.keys(data[0][1]);
    let datasets = [];

    const getDataSetForChart = (data_, property) => {
        const data = data_.map(([date, balances]) => { return fromE8s(parseInt(balances[property]?.e8s || balances[property])) });
        const label = GRAPH_DISPLAY_LABELS[property];
        const boarderWidth = 0.5;
        const pointHoverRadius = 5;
        return {data, label, boarderWidth, radius, pointHoverRadius};
    };

    keys.forEach(key => { 
        const set = getDataSetForChart(data, key);
        datasets.push(set);
    });
    return datasets;
};

const getLabels_balancesHistory = (data) => {return data.map(([date, balances]) => {return date})};

const getLabels_contributions = (data) => {return data.map(([contributor, contributions]) => {
    return contributor.length > 15 ? shortenHexString(contributor) : contributor
})};

export const mapDataMapToChartFormat = (data, nameOfDataSet) => {
    let labels;
    let radius;
    switch(nameOfDataSet){
        case GRAPH_DATA_SETS.balancesHistory.week: labels = getLabels_balancesHistory(data); radius = 2; break;
        case GRAPH_DATA_SETS.balancesHistory.month: labels = getLabels_balancesHistory(data); radius = 2; break;
        case GRAPH_DATA_SETS.balancesHistory.year: labels = getLabels_balancesHistory(data); radius = 2; break;
        case GRAPH_DATA_SETS.balancesHistory.allTime: labels = getLabels_balancesHistory(data); radius = 2; break;
        case GRAPH_DATA_SETS.neuronContributions: labels = getLabels_contributions(data); radius = 125; break;
        case GRAPH_DATA_SETS.usersTotalStakesAndVotingPowers: labels = getLabels_contributions(data); radius = 125; break;
        case GRAPH_DATA_SETS.fundingCampaignContributions: labels = getLabels_contributions(data); radius = 125; break;
    };
    const data_ = { labels, datasets: getDataSetsForChartFromDataMap(data, radius) };
    return { [nameOfDataSet]: data_};
};

export const mapUsersTotalTreasuryStakesAndVotingPowersDataToChartFormat = (usersTreasuryDataArray) => {
    const usersTreasuryDataArraySorted = usersTreasuryDataArray.sort(function(a, b){
        const [principal_a, data_a] = a;
        const [principal_b, data_b] = b;
        if(data_a?.balances?.voting_power > data_b?.balances?.voting_power) return -1;
        else return 1;
    });
    const allUsersTotalIcpStakesAndVotingPowerSorted = [];
    let theRestOfTheUsersVotingPower = 0;
    for(let i = 0; i < usersTreasuryDataArraySorted.length; i++){
        const [principal, {balances}] = usersTreasuryDataArraySorted[i];
        if(i < 10) allUsersTotalIcpStakesAndVotingPowerSorted.push([principal, balances]);
        else theRestOfTheUsersVotingPower += balances.voting_power;
    };
    allUsersTotalIcpStakesAndVotingPowerSorted.push(["Everyone Else", {voting_power: theRestOfTheUsersVotingPower}]);
    return mapDataMapToChartFormat(
        allUsersTotalIcpStakesAndVotingPowerSorted,
        GRAPH_DATA_SETS.usersTotalStakesAndVotingPowers
    );
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
        let coordinate = [date, balances];
        if(length - index < 365) year_dataset.push(coordinate);
        if(length - index < 30) month_dataset.push(coordinate);
        if(length - index < 7) week_dataset.push(coordinate);
        allTime_dataset.push(coordinate);
    });

    return {
        ...mapDataMapToChartFormat(week_dataset, GRAPH_DATA_SETS.balancesHistory.week), 
        ...mapDataMapToChartFormat(month_dataset, GRAPH_DATA_SETS.balancesHistory.month),
        ...mapDataMapToChartFormat(year_dataset, GRAPH_DATA_SETS.balancesHistory.year),
        ...mapDataMapToChartFormat(allTime_dataset, GRAPH_DATA_SETS.balancesHistory.allTime),
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
    const sortedNeuronContributions = neuronContributions_.sort(function({stake_e8s: stake_e8s_a}, {stake_e8s: stake_e8s_b}){
        if(stake_e8s_a > stake_e8s_b) return -1;
        else return 1;
    });
    return sortedNeuronContributions;
}

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

    const usersTreasuryDataArray_ = usersTreasuryDataArray.map(([principal, treasuryData ]) => treasuryDataToFrontendFormat(principal, treasuryData));
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