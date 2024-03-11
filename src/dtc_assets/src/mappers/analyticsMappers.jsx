import { nanoSecondsToMiliSeconds, getDateAsStringMMDDYYY, fromE8s } from "../functionsAndConstants/Utils";
import { GRAPH_DISPLAY_CURRENCIES } from "../functionsAndConstants/Constants";

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
        {...dummyData, label: GRAPH_DISPLAY_CURRENCIES.icp },
        {...dummyData, label: GRAPH_DISPLAY_CURRENCIES.btc },
        {...dummyData, label: GRAPH_DISPLAY_CURRENCIES.eth },
        {...dummyData, label: GRAPH_DISPLAY_CURRENCIES.icp_staked }
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

const mapBalancesDataFromApiToFrontend = (data) => {
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

export default  mapBalancesDataFromApiToFrontend;