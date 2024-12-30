import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { fromE8s, round2Decimals } from "../../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ButtonField from "../../Components/Fields/Button";
import Graph, {getDataSetsInChartFormat} from "../../Components/Fields/Chart";
import { CHART_TYPES, GRAPH_DATA_SET_TIMEFRAMES, GRAPH_DISPLAY_LABELS, GRAPH_DATA_SET_TIMEFRAMES } from "../../functionsAndConstants/Constants";
import InfoToolTip from "../../Components/Fields/InfoToolTip";
import DisplayAllFundingCampaigns from "../../Components/fundingCampaign/DisplayAllFundingCampaigns";
import AccordionField from "../../Components/Fields/Accordion";
import Switch from "../../Components/Fields/Switch";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TabsComponent from '../../Components/Fields/Tabs';
import MenuField from '../../Components/Fields/MenuField';
import CarouselComponent from '../../Components/Fields/Carousel';
import PreviewNeuron from '../../Components/Neurons/PreviewNeuron';

const TIME_FRAMES = [
    GRAPH_DATA_SET_TIMEFRAMES.week, 
    GRAPH_DATA_SET_TIMEFRAMES.month, 
    GRAPH_DATA_SET_TIMEFRAMES.year, 
    GRAPH_DATA_SET_TIMEFRAMES.allTime
];


const TreasuryTab = (props) => {

    const { treasuryState, walletState, navigationAndApiState, setModalIsOpen, setModalIsLoading, setModalProps } = useContext(AppContext);

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

    const [autoContributeToLoans, setAutoContributeToLoans] = useState(treasuryState?.userTreasuryData?.automaticallyContributeToLoans);
    const [autoRepayLoans, setAutoRepayLoans] = useState(treasuryState?.userTreasuryData?.automaticallyRepayLoans);
    const [balancesHistoryDataArray, setBalancesHistoryDataArray] = useState([]);
    const [currencyDataSetName, setCurrencyDataSetName] = useState(GRAPH_DISPLAY_LABELS.icp_staked);
    const [treasuryBalancesDisplayed, setTreasuryBalancesDisplayed] = useState(treasuryBalances[GRAPH_DISPLAY_LABELS.icp_staked]);
    const [chartDataSetTimeFrame, setChartDataSetTimeFrame] = useState(GRAPH_DATA_SET_TIMEFRAMES.month);

    const activeFundingCampaigns = treasuryState.fundingCampaigns.filter(([campaignId, {settled}]) => {return settled === false} );
    const inactiveFundingCampaigns = treasuryState.fundingCampaigns.filter(([campaignId, {settled}]) => {return settled === true} );

    const onSwitchToggle = async (newAutoRepayLoansSetting, newAutoLoanContributionSetting) => {
        setModalIsOpen(true);
        setModalIsLoading(true);
        setAutoRepayLoans(newAutoRepayLoansSetting);
        setAutoContributeToLoans(newAutoLoanContributionSetting);
        await navigationAndApiState.backendActor.updateAutomatedSettings({
            automaticallyContributeToLoans: [newAutoLoanContributionSetting],
            automaticallyRepayLoans: [newAutoRepayLoansSetting]
        });
        setModalIsOpen(false);
        setModalIsLoading(false);
    }; 

    const displayTreasuryAccountId = () => {
        let chars = [...treasuryState.daoIcpAccountId];
        chars.splice(21, 0, " ");
        chars.splice(43, 0, " ");
        const accountId = chars.join('');
        setModalProps({
            flexDirection: "column",
            components: [
                <Typography padding={"10px"} variant='h6' children={"Treasury ICP Account ID:"} />,
                <Typography padding={"10px"} textAlign={"center"} children={accountId} />,
                <ButtonField text={"Copy To Clipboard"} onClick={() => copyText(treasuryState.daoIcpAccountId)} Icon={ContentCopyIcon} iconSize={'small'}/>
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    const openTreasuryAccountIdModal = () => {  
        setModalIsOpen(true);
        setModalProps({
            flexDirection: "column",
            components: [
                <Typography padding={"10px"} varient={"h6"} children={"Be Careful!"}/>,
                <WarningAmberIcon color='secondary'/>,
                <Typography padding={"10px"} marginBottom={"15px"} children={"Sending ICP directly to this account ID will result in no treasury contribution being recorded from your account. In other words, you're essentially donating to the treasury without receiving any credit. If you're not sure what you're doing, do NOT proceed."}/>,
                <ButtonField text={"I understand, proceed"} onClick={displayTreasuryAccountId} iconSize="small" />,
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    useEffect(() => {
        let balancesDataPointsObjArray = [];
        for(let date in treasuryState?.balancesData){
            const daoBalancesDataPointsObj = {...treasuryState.balancesData[date]};
            for(let property in walletState.balancesData[date]) daoBalancesDataPointsObj[`your ${property}`] = walletState.balancesData[date][property];
            balancesDataPointsObjArray.push(daoBalancesDataPointsObj);
        };
        setBalancesHistoryDataArray(balancesDataPointsObjArray);
    },[]);

    const {chartLabels, chartDataSets} = useMemo(() => {
        const relevantDataPoints = [];
        const chartLabels = [];
        for(let index in balancesHistoryDataArray){
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.week && index >= 7) break;
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.month && index >= 31) break;
            if(chartDataSetTimeFrame === GRAPH_DATA_SET_TIMEFRAMES.year && index >= 365) break;
            chartLabels.push("");
            relevantDataPoints.push(balancesHistoryDataArray[index]);
        };
        let chartDataSets = getDataSetsInChartFormat(relevantDataPoints.reverse(), 1);
        chartDataSets = chartDataSets.filter(({label}) => { return label === currencyDataSetName || label === `your ${currencyDataSetName}`});
        return {chartLabels, chartDataSets};
    }, [currencyDataSetName, chartDataSetTimeFrame, balancesHistoryDataArray])

    const currencyMenuItemProps = [
        { text: GRAPH_DISPLAY_LABELS.icp, onClick: () => setCurrencyDataSetName(GRAPH_DISPLAY_LABELS.icp) },
        { text: GRAPH_DISPLAY_LABELS.icp_staked, onClick: () => setCurrencyDataSetName(GRAPH_DISPLAY_LABELS.icp_staked) }
    ];
        
    const neurons = useMemo(() => {
        return treasuryState?.neurons?.icp.filter(neuron => { return !!neuron[1]?.neuronInfo } )
    }, [treasuryState?.neurons]);

    window.scrollTo(0,0);

    return (
        <Grid columns={12} xs={11} md={9} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} paddingTop={"0px"}>
        
            <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"end"}>
                <Grid xs={6}  width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"} flexDirection={"column"}>
                <MenuField label={currencyDataSetName} xs={12} display={"flex"} alignItems={"left"} justifyContent={"left"} color={"primary"} menuItemProps={currencyMenuItemProps} MenuIcon={KeyboardArrowDownIcon}/>
                    <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                        <Typography variant="h4" color={"custom"}>{treasuryBalancesDisplayed.total}</Typography>
                        <InfoToolTip text="YOUR ICP deposited within the treasury. Available for you to use or withdraw." placement="bottom-end" color="white"/>
                    </Grid>
                    {treasuryBalancesDisplayed.multiSig && 
                    <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                        <Typography variant="h6" color={'#bdbdbd'}>{treasuryBalancesDisplayed.multiSig}</Typography>
                        <InfoToolTip text="The amount of ICP within the treasury's multi-sig wallet." placement="bottom-end" color="white"/>
                    </Grid>}
                </Grid>
                <Grid xs={6}  width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"} flexDirection={"column"}>
                    <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>
                        <Typography variant="h6" color={"primary.dark"}>{treasuryBalancesDisplayed.user}</Typography>
                        <InfoToolTip text="The sum of all ICP deposited into the treasury by all users." placement="top-end" color="white"/>
                    </Grid>
                </Grid>
            </Grid>

            <Grid display={"flex"} flexDirection={'column'} xs={12} width={"100%"}>
                <Graph 
                type={CHART_TYPES.line} 
                datasets={chartDataSets}
                labels={chartLabels}
                maintainAspectRatio={false}
                height={"200px"}
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

            <Grid columns={12} xs={12} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} width={"100%"}>
                <Switch
                checked={autoRepayLoans}
                onClick={() => onSwitchToggle(!autoRepayLoans, autoContributeToLoans)}
                labelLeft={"Auto pay on loans received from funding campaigns: "}
                sx={{ paddingTop: "0px", paddingBottom: "0px" }}
                />
                <Switch
                checked={autoContributeToLoans}
                onClick={() => onSwitchToggle(autoRepayLoans, !autoContributeToLoans)}
                labelLeft={"Auto lend to approved funding campaigns: "}
                sx={{ paddingTop: "0px", paddingBottom: "0px" }}
                />
            </Grid>

            {neurons && neurons.length > 0 &&
            <Grid width={"100%"} xs={12} display={'flex'} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
            <Typography variant="h6" >Neurons</Typography>
            <CarouselComponent components={ neurons.map(neuron => { return (<PreviewNeuron neuronData={neuron} userPrincipal={treasuryState?.userPrincipal} />); }) } />
            </Grid> }

            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                <AccordionField>
                <div 
                    title={"Active Funding Campaigns"} 
                    fundingCampaigns={activeFundingCampaigns}
                    CustomComponent={DisplayAllFundingCampaigns}
                ></div>
                <div 
                    title={"Inactive Funding Campaigns"} 
                    fundingCampaigns={inactiveFundingCampaigns}
                    CustomComponent={DisplayAllFundingCampaigns}
                ></div>
                </AccordionField>
            </Grid>
            <ButtonField
            paperSx={{marginTop: "20px"}}
            text={"View Treasury Account ID"}
            onClick={openTreasuryAccountIdModal}
            iconSize={'large'}
            />
        </Grid>
    )
};

export default TreasuryTab;