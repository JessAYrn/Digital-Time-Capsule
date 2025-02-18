import React, { useContext, useState, useMemo } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import MenuField from "../../../components/MenuField";
import ButtonField from "../../../components/Button";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InfoToolTip from "../../../components/InfoToolTip";
import { round2Decimals, fromE8s } from "../../../functionsAndConstants/Utils";
import { AppContext } from "../../../Context";
import { GRAPH_DISPLAY_LABELS, GRAPH_DATA_SET_TIMEFRAMES, CHART_TYPES } from "../../../functionsAndConstants/Constants";
import TabsComponent from '../../../components/Tabs';
import Graph, {getLabelsAndDataSetsInChartFormat} from "../../../components/Chart";
import Typography from "@mui/material/Typography";
import { WHITE_COLOR } from "../../../Theme";

const TIME_FRAMES = [
    GRAPH_DATA_SET_TIMEFRAMES.week, 
    GRAPH_DATA_SET_TIMEFRAMES.month, 
    GRAPH_DATA_SET_TIMEFRAMES.year, 
    GRAPH_DATA_SET_TIMEFRAMES.allTime
];

const RenderBalances = () => {

    const {  walletState, setModalIsOpen, setModalProps } = useContext(AppContext);

    const [currencyDataSetName, setCurrencyDataSetName] = useState(GRAPH_DISPLAY_LABELS.icp);
    const [chartDataSetTimeFrame, setChartDataSetTimeFrame] = useState(GRAPH_DATA_SET_TIMEFRAMES.month);

    const walletBalances = {
        [GRAPH_DISPLAY_LABELS.icp]: round2Decimals(fromE8s( walletState?.walletData?.balance || 0))
    };

    const {chartLabels, chartDataSets} = useMemo(() => {

        let count = 0;
        const dataMapArray = [];
        for(let [date, balances] of Object.entries(walletState?.balancesData)){
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.week && count >= 7) break;
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.month && count >= 31) break;
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.year && count >= 365) break;
            const label = date;
            const dataPointsObj = { [currencyDataSetName]: balances[currencyDataSetName] };
            dataMapArray.push([label, dataPointsObj]);
            count ++
        };
        let {labels, datasets} = getLabelsAndDataSetsInChartFormat(dataMapArray.reverse(), 1, true);
        return {chartLabels: labels, chartDataSets: datasets};
    }, [currencyDataSetName, chartDataSetTimeFrame])

    const currencyMenuItemProps = [
        { text: GRAPH_DISPLAY_LABELS.icp, onClick: () => { setCurrencyDataSetName(GRAPH_DISPLAY_LABELS.icp); }},
    ];

    return (
        <>
            <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} flexDirection={"column"} alignItems={"center"} padding={0}>
                <MenuField label={currencyDataSetName} xs={12} display={"flex"} alignItems={"left"} justifyContent={"left"} color={"primary"} menuItemProps={currencyMenuItemProps} MenuIcon={KeyboardArrowDownIcon}/>
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"} padding={0}>
                    <Typography variant="h4">{walletBalances[currencyDataSetName]}</Typography>
                    <InfoToolTip text={`The ${currencyDataSetName} deposited into your wallet.`} placement="top-end" color={WHITE_COLOR}/>
                </Grid>
            </Grid>
            <Grid display={"flex"} flexDirection={'column'} xs={12} width={"100%"} padding={0} marginTop={"30px"}>
                <Graph 
                type={CHART_TYPES.line} 
                datasets={chartDataSets}
                labels={chartLabels}
                maintainAspectRatio={false}
                height={"325px"}
                width={"100%"}
                />
                <TabsComponent
                tabs={TIME_FRAMES} 
                selectedTab={chartDataSetTimeFrame} 
                setSelectedTab={setChartDataSetTimeFrame} 
                indicatorColor={"primary"}
                sx={{ backgroundColor: "transparent", position: "relative"}}
                />
            </Grid>
        </>
    );

};

export default RenderBalances;