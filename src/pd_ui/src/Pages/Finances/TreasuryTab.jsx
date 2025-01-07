import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import { fromE8s, round2Decimals } from "../../functionsAndConstants/Utils";
import Graph, {getLabelsAndDataSetsInChartFormat} from "../../Components/Fields/Chart";
import { CHART_TYPES, GRAPH_DATA_SET_TIMEFRAMES, GRAPH_DISPLAY_LABELS, GRAPH_DATA_SET_TIMEFRAMES } from "../../functionsAndConstants/Constants";
import InfoToolTip from "../../Components/Fields/InfoToolTip";
import DisplayAllFundingCampaigns from "../../Components/fundingCampaign/DisplayAllFundingCampaigns";
import AccordionField from "../../Components/Fields/Accordion";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TuneIcon from '@mui/icons-material/Tune';
import TabsComponent from '../../Components/Fields/Tabs';
import MenuField from '../../Components/Fields/MenuField';
import CarouselComponent from '../../Components/Fields/Carousel';
import PreviewNeuron from '../../Components/Neurons/PreviewNeuron';
import ButtonField from '../../Components/Fields/Button';
import TreasuryConfingurationsComponent from '../../Components/modalPages/financesPageModals/TreasuryConfigurations';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { copyText } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';

const TIME_FRAMES = [
    GRAPH_DATA_SET_TIMEFRAMES.week, 
    GRAPH_DATA_SET_TIMEFRAMES.month, 
    GRAPH_DATA_SET_TIMEFRAMES.year, 
    GRAPH_DATA_SET_TIMEFRAMES.allTime
];


const TreasuryTab = (props) => {

    const { treasuryState, walletState, setModalIsOpen, setModalProps } = useContext(AppContext);

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

    const [currencyDataSetName, setCurrencyDataSetName] = useState(GRAPH_DISPLAY_LABELS.icp_staked);
    const [chartDataSetTimeFrame, setChartDataSetTimeFrame] = useState(GRAPH_DATA_SET_TIMEFRAMES.month);

    const activeFundingCampaigns = treasuryState.fundingCampaigns.filter(([campaignId, {settled}]) => {return settled === false} );
    const inactiveFundingCampaigns = treasuryState.fundingCampaigns.filter(([campaignId, {settled}]) => {return settled === true} );

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
        
    const neurons = useMemo(() => {
        return treasuryState?.neurons?.icp.filter(neuron => { return !!neuron[1]?.neuronInfo } )
    }, [treasuryState?.neurons]);


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
        <Grid columns={12} xs={11} md={9} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} paddingTop={"15px"}>
        
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

            {neurons && neurons.length > 0 &&
                <CarouselComponent 
                    title={"Neurons"} 
                    sx={{marginTop: "75px"}}
                    defaultComponent={<Typography textAlign={"center"} component={"There are currently no neurons staked in this treasury"} />}
                >
                    { neurons.map(neuron => { return (<PreviewNeuron neuronData={neuron} userPrincipal={treasuryState?.userPrincipal} />); }) }
                </CarouselComponent>
            }

            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                {/* <AccordionField>
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
                </AccordionField> */}
            </Grid>
            <ButtonField
                gridSx={{marginTop: "20px", marginBottom: "60px"}}
                text={"View Treasury Account ID"}
                onClick={openTreasuryAccountIdModal}
                iconSize={'large'}
            />
        </Grid>
    )
};

export default TreasuryTab;