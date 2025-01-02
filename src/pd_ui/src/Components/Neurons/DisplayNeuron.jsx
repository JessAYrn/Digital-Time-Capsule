import React, {useContext, useMemo} from "react";
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import { fromE8s, round2Decimals, secondsToHours, hoursToDays, daysToMonths } from "../../functionsAndConstants/Utils";
import Graph, { getDataSetsInChartFormat } from "../Fields/Chart";
import { CHART_TYPES } from "../../functionsAndConstants/Constants";
import { neuronContributionsTableColumns, mapNeuronContributionsToTableRows } from "../../mappers/treasuryPageMapperFunctions";
import { getTotalContributions, getUserNeuronContribution } from "../../functionsAndConstants/treasuryDataFunctions";
import { GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import ButtonField from "../Fields/Button";
import AddIcon from '@mui/icons-material/Add';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DataTable from "../Fields/Table";
import CreateProposalForm from "../modal/proposals/CreateProposalForm";
import { PROPOSAL_ACTIONS } from "../modal/proposals/utils";

const NeuronStates = { locked: 1, dissolving: 2, unlocked: 3, spawning: 4 };

const DisplayNeuron = (props) => {
    const { neuronData, userPrincipal} = props;

    const [neuronId, {contributions, neuron, neuronInfo}] = neuronData;

    let timeSpan = "hours";
    let dissolveDelay = secondsToHours(parseInt(neuronInfo?.dissolve_delay_seconds || 0));
    if(dissolveDelay > 24){ dissolveDelay = hoursToDays(dissolveDelay); timeSpan = "days";};
    if(dissolveDelay > 30){ dissolveDelay = daysToMonths(dissolveDelay); timeSpan = "months";};

    let userContribution = getUserNeuronContribution(userPrincipal, contributions);

    const totalContributions = getTotalContributions(contributions);

    let userRemainingStake = parseInt(neuronInfo.stake_e8s) * parseInt(userContribution.stake_e8s) / totalContributions;
    let userVotingPower = parseInt(neuronInfo.voting_power) * parseInt(userContribution.stake_e8s) / totalContributions;

    let neuronState = "unlocked";
    let buttonIcon = LockOpenIcon;

    if(neuronInfo?.state === NeuronStates.locked)  {neuronState = "Locked"; buttonIcon = LockIcon;}
    else if(neuronInfo?.state === NeuronStates.dissolving)  {neuronState = "Dissolving"; buttonIcon = HourglassTopIcon;}
    else if(neuronInfo?.state === NeuronStates.unlocked)  {neuronState = "unlocked"; buttonIcon = LockOpenIcon;}
    else if(neuronInfo?.state === NeuronStates.spawning)  {neuronState = "Spawning"; buttonIcon = HistoryToggleOffIcon;}

    const userMaturity = round2Decimals(fromE8s(parseInt(neuron?.maturity_e8s_equivalent || 0) * (parseInt(userContribution.stake_e8s)/parseInt(totalContributions || 1))));
    const { setModalIsOpen, setModalProps, homePageState } = useContext(AppContext)

    const openProposalForm = (props) => {
        let {proposalAction, proposalPayload } = props;
        setModalIsOpen(true);
        setModalProps({
            components: [
                <CreateProposalForm proposalAction={proposalAction} proposalPayload={proposalPayload}/>
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };
    const {chartLabels, chartDataSets} = useMemo(() => {
        const chartLabels = [];
        const contributionsObjsArray = [];

        for(let [principal, neuronContributionObj] of contributions){
            chartLabels.push(homePageState?.canisterData?.userNames[principal]);
            for(let property in neuronContributionObj) neuronContributionObj[property] = fromE8s(parseInt(neuronContributionObj[property]))
            contributionsObjsArray.push(neuronContributionObj);
        };
        let  chartDataSets =  getDataSetsInChartFormat(contributionsObjsArray, 125);

        const includedDataSets = [GRAPH_DISPLAY_LABELS.votingPower, GRAPH_DISPLAY_LABELS.stake_e8s];
        chartDataSets = chartDataSets.filter(({label}) => { return includedDataSets.includes(label)});
        chartDataSets = chartDataSets.map(dataSet => {
            if(dataSet.label === GRAPH_DISPLAY_LABELS.stake_e8s) return {...dataSet, label: GRAPH_DISPLAY_LABELS.icp_staked};
            else return dataSet
        });

        return {chartLabels, chartDataSets};
    }, [contributions]);

    return (
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} flexDirection={"column"} marginTop={"60px"} padding={0}>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                <Typography width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Neuron Voting Power</Typography>
                <Typography width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"} variant="h6">{`${neuronInfo?.voting_power ? round2Decimals(fromE8s(parseInt(neuronInfo?.voting_power))) : "Spawning..."}`}</Typography>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>Your Voting Power</Typography>
                <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>{contributions.length ? `${round2Decimals(fromE8s(parseInt(userVotingPower)))}`: "Spawning..."}</Typography>
            </Grid>

            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"25px"}>
                <Typography width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Neuron Stake</Typography>
                <Typography width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"} variant="h6">{neuronInfo?.stake_e8s ? `${round2Decimals(fromE8s(parseInt(neuronInfo?.stake_e8s)))} ICP` : "Spawning..."}</Typography>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>Your Stake</Typography>
                <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>{contributions.length ? `${round2Decimals(fromE8s(parseInt(userRemainingStake)))} ICP` : "Spawning..."}</Typography>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"10px"}>
                <Grid display={"flex"} justifyContent={"right"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                    <ButtonField
                    gridSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "160px"}}
                    elevation={0}
                    text={"Increase Stake"}
                    onClick={() => openProposalForm({
                        proposalAction: PROPOSAL_ACTIONS.IncreaseNeuron,
                        proposalPayload: {neuronId}
                    })}
                    disabled={contributions.length === 0}
                    Icon={AddIcon}
                    iconSize={'small'}
                    />
                </Grid>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"25px"}>
                <Typography width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>Neuron State</Typography>
                <ButtonField
                    gridSx={{display: "flex", justifyContent: "right", alignItems: "center", width: "50%"}}
                    transparentBackground={true}
                    elevation={0}
                    text={neuronState}
                    onClick={() => {}}
                    Icon={buttonIcon}
                    iconSize={'small'}
                    disabled={true}
                />
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                <Typography width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>Dissolve Delay</Typography>
                <ButtonField
                    gridSx={{display: "flex", justifyContent: "right", alignItems: "center", width: "50%"}}
                    transparentBackground={true}
                    elevation={0}
                    text={`${round2Decimals(dissolveDelay)} ${timeSpan}`}
                    onClick={() => {}}
                    Icon={HourglassTopIcon}
                    iconSize={'small'}
                    disabled={true}
                />
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"10px"}>
                <Grid display={"flex"} justifyContent={"left"} alignItems={"center"} width={"33%"} xs={12} padding={0}>
                    <ButtonField
                    gridSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "230px"}}
                    elevation={0}
                    text={"Dissolve Neuron"}
                    onClick={() => openProposalForm({
                        proposalAction: PROPOSAL_ACTIONS.DissolveNeuron,
                        proposalPayload: {neuronId}
                    })}
                    iconSize={'small'}
                    />
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"33%"} xs={12} padding={0}>
                    <ButtonField
                    gridSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "230px"}}
                    elevation={0}
                    text={"Disperse Neuron"}
                    disabled={contributions.length === 0}
                    onClick={() => openProposalForm({
                        proposalAction: PROPOSAL_ACTIONS.DisburseNeuron,
                        proposalPayload: {neuronId}
                    })}
                    iconSize={'small'}
                    />
                </Grid>
                <Grid display={"flex"} justifyContent={"right"} alignItems={"center"} width={"33%"} xs={12} padding={0}>
                    <ButtonField
                    gridSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "230px"}}
                    elevation={0}
                    text={"Increase Dissolve Delay"}
                    onClick={() => openProposalForm({
                        proposalAction: PROPOSAL_ACTIONS.IncreaseDissolveDelay,
                        proposalPayload: {neuronId}
                    })}
                    disabled={contributions.length === 0}
                    Icon={AddIcon}
                    iconSize={'small'}
                    />
                </Grid>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"25px"}>
                <Typography width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Neuron Maturity</Typography>
                <Typography width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"} variant="h6">{`${round2Decimals(fromE8s(parseInt(neuron?.maturity_e8s_equivalent || 0)))} ICP`}</Typography>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>Your Maturity</Typography>
                <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>{contributions.length ? `${userMaturity} ICP`: "Spawning..."}</Typography>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"10px"}>
                <Grid display={"flex"} justifyContent={"right"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                    <ButtonField
                    gridSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "230px"}}
                    elevation={0}
                    text={"Spawn Neuron From Maturity"}
                    disabled={contributions.length === 0}
                    onClick={() => openProposalForm({
                        proposalAction: PROPOSAL_ACTIONS.SpawnNeuron,
                        proposalPayload: {neuronId}
                    })}
                    iconSize={'small'}
                    />
                </Grid>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} width={"100%"}  padding={0} paddingTop={"25px"} flexDirection={'column'}>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                    <Typography width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Neuron Contributions: </Typography>
                </Grid>
                {contributions.length === 0 ? 
                    <Typography width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} variant="h6">Spawning...</Typography> : 
                    <>
                        <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"}>
                            <Graph
                                withoutPaper={true}
                                width={"25%"}
                                height={"400px"}
                                type={CHART_TYPES.pie}
                                labels={chartLabels}
                                datasets={chartDataSets}
                                maintainAspectRatio={false}
                            />  
                        </Grid>
                        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} flexDirection={"column"} width={"100%"}>
                            <DataTable
                                transparent={true}
                                columns={neuronContributionsTableColumns}
                                rows={mapNeuronContributionsToTableRows(contributions, homePageState?.canisterData?.userNames)}
                            />
                        </Grid>
                    </>}
            </Grid>
        </Grid>
    );

};

export default DisplayNeuron;