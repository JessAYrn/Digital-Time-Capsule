import React, {useState} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import { fromE8s, round2Decimals, secondsToHours, hoursToDays, daysToMonths } from "../../functionsAndConstants/Utils";
import Graph from "../Fields/Chart";
import { CHART_TYPES, GRAPH_DATA_SETS, GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import { getUserNeuronContribution, mapNeuronContributionsDataToChartFormat, neuronContributionsTableColumns, mapNeuronContributionsToTableRows } from "../../mappers/treasuryPageMapperFunctions";
import ButtonField from "../Fields/Button";
import AddIcon from '@mui/icons-material/Add';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DataTable from "../Fields/Table";
import CreateProposalForm from "../proposals/CreateProposalForm";
import ModalComponent from "../modal/Modal";
import { PROPOSAL_ACTIONS } from "../proposals/utils";

const NeuronStates = {
    locked: 1,
    dissolving: 2,
    unlocked: 3,
    spawning: 4,
}


const DisplayNeuron = (props) => {
    const {
        neuronData,
        userPrincipal
    } = props;

    const [neuronId, neuronData_] = neuronData;
    const{contributions, neuron, neuronInfo} = neuronData_;

    let timeSpan = "hours";
    let dissolveDelay = secondsToHours(parseInt(neuronInfo?.dissolve_delay_seconds || 0));
    if(dissolveDelay > 24){ dissolveDelay = hoursToDays(dissolveDelay); timeSpan = "days";};
    if(dissolveDelay > 30){ dissolveDelay = daysToMonths(dissolveDelay); timeSpan = "months";};

    let userContribution = getUserNeuronContribution(userPrincipal, contributions);
    let neuronState = "unlocked";
    let buttonIcon = LockOpenIcon;

    if(neuronInfo?.state === NeuronStates.locked)  {neuronState = "Locked"; buttonIcon = LockIcon;}
    else if(neuronInfo?.state === NeuronStates.dissolving)  {neuronState = "Dissolving"; buttonIcon = HourglassTopIcon;}
    else if(neuronInfo?.state === NeuronStates.unlocked)  {neuronState = "unlocked"; buttonIcon = LockOpenIcon;}
    else if(neuronInfo?.state === NeuronStates.spawning)  {neuronState = "Spawning"; buttonIcon = HistoryToggleOffIcon;}

    const userMaturity = fromE8s(parseInt(neuron?.maturity_e8s_equivalent || 0) * (parseInt(userContribution.stake_e8s)/parseInt(neuronInfo?.stake_e8s || 1)));

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const openProposalForm = (props) => {
        let {proposalAction, proposalPayload } = props;
        setModalIsOpen(true);
        setModalProps({
            components: [
              {
                Component: CreateProposalForm,
                props: {
                    setModalIsOpen, 
                    setModalProps, 
                    setIsLoadingModal,
                    proposalAction,
                    proposalPayload,
                }
              }
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    return (
        <>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} flexDirection={"column"} padding={0}>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                    <Typography width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Neuron Voting Power</Typography>
                    <Typography width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"} variant="h6">{`${neuronInfo?.voting_power ? round2Decimals(fromE8s(parseInt(neuronInfo?.voting_power))) : "Retrieving..."}`}</Typography>
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                    <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>Your Voting Power</Typography>
                    <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>{`${round2Decimals(fromE8s(parseInt(userContribution.voting_power)))}`}</Typography>
                </Grid>

                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"25px"}>
                    <Typography width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Neuron Stake</Typography>
                    <Typography width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"} variant="h6">{neuronInfo?.stake_e8s ? `${round2Decimals(fromE8s(parseInt(neuronInfo?.stake_e8s)))} ICP` : "Retrieving..."}</Typography>
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                    <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>Your Stake</Typography>
                    <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>{`${round2Decimals(fromE8s(parseInt(userContribution.stake_e8s)))} ICP`}</Typography>
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"10px"}>
                    <Grid display={"flex"} justifyContent={"right"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                        <ButtonField
                        paperSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "160px"}}
                        elevation={0}
                        text={"Increase Stake"}
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.IncreaseNeuron,
                            proposalPayload: {neuronId}
                        })}
                        Icon={AddIcon}
                        iconSize={'small'}
                        />
                    </Grid>
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"25px"}>
                    <Typography width={"50%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>Neuron State</Typography>
                    <ButtonField
                        paperSx={{display: "flex", justifyContent: "right", alignItems: "center", width: "50%"}}
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
                        paperSx={{display: "flex", justifyContent: "right", alignItems: "center", width: "50%"}}
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
                        paperSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "230px"}}
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
                        paperSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "230px"}}
                        elevation={0}
                        text={"Disperse Neuron"}
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.DisburseNeuron,
                            proposalPayload: {neuronId}
                        })}
                        iconSize={'small'}
                        />
                    </Grid>
                    <Grid display={"flex"} justifyContent={"right"} alignItems={"center"} width={"33%"} xs={12} padding={0}>
                        <ButtonField
                        paperSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "230px"}}
                        elevation={0}
                        text={"Increase Dissolve Delay"}
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.IncreaseDissolveDelay,
                            proposalPayload: {neuronId}
                        })}
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
                    <Typography color={"#bdbdbd"} width={"50%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>{`${round2Decimals(userMaturity)} ICP`}</Typography>
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"10px"}>
                    <Grid display={"flex"} justifyContent={"right"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                        <ButtonField
                        paperSx={{display: "flex", justifyContent: "center", alignItems: "center", width: "230px"}}
                        elevation={0}
                        text={"Spawn Neuron From Maturity"}
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.SpawnNeuron,
                            proposalPayload: {neuronId}
                        })}
                        iconSize={'small'}
                        />
                    </Grid>
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} paddingTop={"25px"} flexDirection={'column'}>
                    <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                        <Typography width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Neuron Contributions: </Typography>
                    </Grid>
                    <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"}>
                        <Graph
                            withoutPaper={true}
                            width={"25%"}
                            hideButton2={true}
                            type={CHART_TYPES.pie}
                            defaultLabel={GRAPH_DISPLAY_LABELS.stake}
                            inputData={mapNeuronContributionsDataToChartFormat(contributions)}
                            defaultDataSetName={GRAPH_DATA_SETS.neuronContributions}
                        />  
                    </Grid>
                    <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} flexDirection={"column"} width={"100%"}>
                        <DataTable
                            transparent={true}
                            columns={neuronContributionsTableColumns}
                            rows={mapNeuronContributionsToTableRows(contributions)}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <ModalComponent 
                {...modalProps}
                open={modalIsOpen} 
                isLoading={isLoadingModal} 
            /> 
        </>
    );

};

export default DisplayNeuron;