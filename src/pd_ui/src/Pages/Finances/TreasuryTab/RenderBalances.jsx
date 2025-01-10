import React, { useContext, useState, useMemo } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import MenuField from "../../../Components/MenuField";
import ButtonField from "../../../Components/Button";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TuneIcon from '@mui/icons-material/Tune';
import InfoToolTip from "../../../Components/InfoToolTip";
import { round2Decimals, fromE8s } from "../../../functionsAndConstants/Utils";
import { AppContext } from "../../../Context";
import { GRAPH_DISPLAY_LABELS, GRAPH_DATA_SET_TIMEFRAMES, CHART_TYPES } from "../../../functionsAndConstants/Constants";
import TreasuryConfingurationsComponent from '../../../modals/financesPageModals/TreasuryConfigurations';
import TabsComponent from '../../../Components/Tabs';
import Graph, {getLabelsAndDataSetsInChartFormat} from "../../../Components/Chart";
import Typography from "@mui/material/Typography";

const TIME_FRAMES = [
    GRAPH_DATA_SET_TIMEFRAMES.week, 
    GRAPH_DATA_SET_TIMEFRAMES.month, 
    GRAPH_DATA_SET_TIMEFRAMES.year, 
    GRAPH_DATA_SET_TIMEFRAMES.allTime
];

const RenderBalances = () => {

    const { treasuryState, walletState, setModalIsOpen, setModalProps } = useContext(AppContext);

    const [currencyDataSetName, setCurrencyDataSetName] = useState(GRAPH_DISPLAY_LABELS.icp_staked);
    const [chartDataSetTimeFrame, setChartDataSetTimeFrame] = useState(GRAPH_DATA_SET_TIMEFRAMES.month);

    const treasuryBalances = {
        [GRAPH_DISPLAY_LABELS.icp_staked]: {
            total: round2Decimals(fromE8s(treasuryState?.daoTotalIcpStaked)),
            user: round2Decimals(fromE8s(treasuryState?.userTreasuryData?.balances?.icp_staked || 0))
        },
        [GRAPH_DISPLAY_LABELS.voting_power]: {
            total: round2Decimals(fromE8s(treasuryState.votingPower)),
            user: round2Decimals(fromE8s(treasuryState.userVotingPower))
        },
        [GRAPH_DISPLAY_LABELS.icp]: {
            total: round2Decimals(fromE8s(treasuryState.totalDeposits)),
            user: round2Decimals(fromE8s(treasuryState.userTreasuryData?.balances.icp || 0)),
            multiSig: round2Decimals(fromE8s(treasuryState.daoWalletBalance))
        }
    };

    const {chartLabels, chartDataSets} = useMemo(() => {

        let count = 0;
        const dataMapArray = [];
        for(let [date, balances] of Object.entries(treasuryState?.balancesData)){
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.week && count >= 7) break;
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.month && count >= 31) break;
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.year && count >= 365) break;
            const label = date;
            const dataPointsObj = {
                [currencyDataSetName]: balances[currencyDataSetName],
                [`your ${currencyDataSetName}`]: walletState?.balancesData[date] ? walletState?.balancesData[date][currencyDataSetName] : null
            };
            dataMapArray.push([label, dataPointsObj])
            count ++
        };

        let {labels, datasets} = getLabelsAndDataSetsInChartFormat(dataMapArray.reverse(), 1, true);
        
        return {chartLabels: labels, chartDataSets: datasets};

    }, [currencyDataSetName, chartDataSetTimeFrame])

    const currencyMenuItemProps = [
        { text: GRAPH_DISPLAY_LABELS.icp, onClick: () => { setCurrencyDataSetName(GRAPH_DISPLAY_LABELS.icp); }},
        { text: GRAPH_DISPLAY_LABELS.icp_staked, onClick: () => { setCurrencyDataSetName(GRAPH_DISPLAY_LABELS.icp_staked); }}
    ];

    const openTreasuryConfigurationsPage = () => {  
        setModalIsOpen(true);
        setModalProps({
            fullScreen: true,
            components: [
                <TreasuryConfingurationsComponent/>
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    return (
        <>
            <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} flexDirection={"column"} alignItems={"center"} padding={0}>
                <Grid xs={12}  width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={0}>
                    <MenuField label={currencyDataSetName} xs={6} display={"flex"} alignItems={"left"} justifyContent={"left"} color={"primary"} menuItemProps={currencyMenuItemProps} MenuIcon={KeyboardArrowDownIcon}/>
                    <ButtonField transparentBackground={true} Icon={TuneIcon} onClick={openTreasuryConfigurationsPage} gridSx={{ width: "100%", alignItems: "right", justifyContent:"right" }}/>
                </Grid>
                <Grid xs={12}  width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                    <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                        <Typography variant="h4" color={"custom"}>{treasuryBalances[currencyDataSetName]?.total}</Typography>
                        <InfoToolTip text={`The sum of all ${currencyDataSetName} deposited into the treasury by all users.`} placement="top-end" color="white"/>
                    </Grid>
                    <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>
                        <Typography variant="h6" color={"primary.dark"}>{treasuryBalances[currencyDataSetName]?.user}</Typography>
                        <InfoToolTip text={`The amount of ${currencyDataSetName} deposited within the treasury. Available for you to use within the DeFi protocol as you wish.`} placement="bottom-end" color="white"/>
                    </Grid>
                </Grid>
                {treasuryBalances[currencyDataSetName]?.multiSig && 
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                    <Typography variant="h6" color={'#bdbdbd'}>{treasuryBalances[currencyDataSetName]?.multiSig}</Typography>
                    <InfoToolTip text={`The amount of ${currencyDataSetName} within the treasury's multi-sig wallet. Available for use via proposals submitted to the DAO and voted on by staking members.`} placement="bottom-end" color="white"/>
                </Grid>}
            </Grid>

            <Grid display={"flex"} flexDirection={'column'} xs={12} width={"100%"} padding={0}>
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
                sx={{ backgroundColor: "transparent", position: "relative", top: "28px"}}
                />
            </Grid>
        </>
    );

};

export default RenderBalances;