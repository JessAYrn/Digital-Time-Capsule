import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import DataField from "../Fields/DataField";
import Typography from "@mui/material/Typography";
import { nanoSecondsToMiliSeconds, getDateAsStringMMDDYYY, shortenHexString, fromE8s, round2Decimals, secondsToHours, hoursToDays, daysToMonths, milisecondsToNanoSeconds } from "../../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { getProposalType } from "./utils";
import CloseIcon from '@mui/icons-material/Close';
import ButtonField from "../Fields/Button";
import CheckIcon from '@mui/icons-material/Check';
import ModalComponent from "../modal/Modal";
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { NEURON_TOPICS } from "./CreateProposalForm";
import { AppContext } from "../../Context";
import { homePageTypes } from "../../reducers/homePageReducer";
import { PROPOSAL_ACTIONS } from "./utils";
import Graph from "../Fields/Chart";
import { CHART_TYPES, GRAPH_DATA_SETS, GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import { mapUsersTotalTreasuryStakesAndVotingPowersDataToChartFormat } from "../../mappers/treasuryPageMapperFunctions";
import Grid from "@mui/material/Unstable_Grid2/Grid2";


const CYCLES_COSTS_ASSOCIATED_WITH_ACTIONS = [
    PROPOSAL_ACTIONS.FollowNeuron,
    PROPOSAL_ACTIONS.IncreaseNeuron,
    PROPOSAL_ACTIONS.SpawnNeuron,
    PROPOSAL_ACTIONS.DisburseNeuron,
    PROPOSAL_ACTIONS.DissolveNeuron,
    PROPOSAL_ACTIONS.IncreaseDissolveDelay,
    PROPOSAL_ACTIONS.FollowNeuron,
    PROPOSAL_ACTIONS.CreateNeuron,
];

const Proposal = (props) => {


    const {
        proposalId,
        proposer,
        action,
        timeInitiated,
        executed,
        timeVotingPeriodEnds,
        votes,
        finalized,
        voteTally
    } = props;

    const [modalProps, setModalProps] = useState({});
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoading] = useState(false);

    let numberOfNays = votes.filter(vote => vote[1].adopt === false).length;
    let numberOfYays = votes.filter(vote => vote[1].adopt === true).length;
    let totalVotes = votes.length;

    const { actorState, homePageDispatch, treasuryState } = useContext(AppContext);

    const timeRemainingInNanoseconds = parseInt(timeVotingPeriodEnds) - milisecondsToNanoSeconds(Date.now());
    const timeRemainingInSeconds = timeRemainingInNanoseconds / 1000000000;
    const timeRemainingInHours = timeRemainingInSeconds / 3600;

    let actionType = getProposalType(action);
    let payload = action[actionType];
    let {yay, nay, totalParticipated} = voteTally;

    const displayHypotheticalTreasuryData = () => {
        if(finalized) return;
        let { amount: amountToIncreaseNeuron, neuronId } = payload;
        let {neurons} = treasuryState;  
        let neuronData = neurons.icp.find(([neuronId_, _]) => neuronId_ === BigInt(neuronId).toString());
        if(!neuronData) return;
        let {neuronInfo} = neuronData[1];
        let {stake_e8s: neuronTotalStake, voting_power: neuronTotalVotingPower} = neuronInfo;
        let votingPowerBonusMultipllier = neuronTotalVotingPower / neuronTotalStake;
        let proposerTreasuryData = treasuryState?.usersTreasuryDataArray.find(([principal, _]) => { return principal === proposer; });
        if(!proposerTreasuryData) proposerTreasuryData = [proposer, {balances: {icp_staked: 0, voting_power: 0}}];
        proposerTreasuryData[1] = {
            ...proposerTreasuryData[1], 
            balances: {
                ...proposerTreasuryData[1].balances,
                icp_staked: proposerTreasuryData[1].balances.icp_staked + parseInt(amountToIncreaseNeuron), 
                voting_power: proposerTreasuryData[1].balances.voting_power + (parseInt(amountToIncreaseNeuron) * parseInt(votingPowerBonusMultipllier))
            }
        };
        const hypotheticalUsersTreasuryDataArray = treasuryState?.usersTreasuryDataArray.map(([principal, userTreasuryData]) => {
            if(principal === proposer) return proposerTreasuryData;
            return [principal, userTreasuryData];
        });

        return (
            <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
                <Typography variant="h6">Voting Power Distribution If Approved: </Typography>
                <Graph
                    type={CHART_TYPES.pie}
                    defaultLabel={GRAPH_DISPLAY_LABELS.votingPower}
                    inputData={mapUsersTotalTreasuryStakesAndVotingPowersDataToChartFormat(hypotheticalUsersTreasuryDataArray)}
                    defaultDataSetName={GRAPH_DATA_SETS.usersTotalStakesAndVotingPowers}
                    height={"400px"}
                    maintainAspectRatio={false}
                    hideButton1={true}
                    hideButton2={true}
                />
            </Grid>
        );
    }

    const onConfirmVote = async (bool) => {
        setIsLoading(true);
        let result = await actorState.backendActor.voteOnProposal(proposalId, bool);
        setIsLoading(false);
        if(result.err){
            setModalProps({
                smallText: `Your vote could not be successfully submitted.`,
                components: [{
                    Component: ButtonField,
                    props: {
                        active: true,
                        text: "Close",
                        Icon: CloseIcon,
                        onClick: () => setModalIsOpen(false)
                    }
                }]
            });
            return;
        } else if(result.ok) {
            let updatedProposals = result.ok;
            homePageDispatch({
                actionType: homePageTypes.SET_PROPOSALS_DATA,
                payload: updatedProposals
            });
        }
        setModalIsOpen(false);
    };

    const getModalButtonsComponents = (bool) => {
        return [
            {Component: ButtonField,
            props: {
                active: true,
                text: "Cancel",
                Icon: CloseIcon,
                onClick: () => setModalIsOpen(false)
            }},
            {Component: ButtonField,
            props: {
                active: true,
                text: "Confirm",
                Icon: CheckIcon,
                onClick: () => onConfirmVote(bool)
            }}
        ]
    };

    const onVote = (bool) => {
        const decision = bool ? "ADOPT" : "REJECT";
        setModalIsOpen(true);
        setModalProps({
            smallText: `Confirm your vote to ${decision} proposal #${proposalId}`,
            components: getModalButtonsComponents(bool)
        })
    };

    return(
        <Grid 
            xs={12} 
            rowSpacing={0} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"} 
        >
            <Grid 
                columns={12}
                xs={12} 
                rowSpacing={0} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"} 
            >
                { timeRemainingInNanoseconds > 0 && <DataField
                    label={'Voting Ends in: '}
                    text={`${round2Decimals(timeRemainingInHours)} hours`}
                    disabled={true}
                />}
                <DataField
                    label={'Action: '}
                    text={`${getProposalType(action)}`}
                    disabled={true}
                />
                { payload && 
                    <>
                        {
                            Object.keys(payload).map((key, index) => {
                                let text = payload[key];
                                let key_ = key;
                                let onClick = () => {};
                                let isDisabled = true;
                                switch(key){
                                    case "principal":
                                        text = shortenHexString(payload[key]);
                                        onClick = () => copyText(payload[key]);
                                        isDisabled = false;
                                        break;
                                    case "neuronId":
                                        text = BigInt(payload[key]).toString();
                                        onClick = () => copyText(text);
                                        isDisabled = false;
                                        break;
                                    case "followees":
                                        text = BigInt(payload[key][0]).toString();
                                        onClick = () => copyText(text);
                                        isDisabled = false;
                                        break;
                                    case "topic":
                                        text = Object.keys(NEURON_TOPICS).find(thisKey => NEURON_TOPICS[thisKey] === payload[key]);
                                        break;
                                    case "additionalDissolveDelaySeconds":
                                        text = `${ daysToMonths(hoursToDays(secondsToHours(payload[key]))) } months`; 
                                        key_ = "additionalDissolveDelay";
                                        break;
                                    case "amount":
                                        text = fromE8s(parseInt(payload[key])) + ' ICP';
                                        break;
                                    case "percentage_to_spawn":
                                        text = `${payload[key]}%`;
                                        break;
                                    default:
                                        break;
                                }
                                
                                return(
                                    <DataField
                                        label={key_}
                                        text={`${text}`}
                                        disabled={isDisabled}
                                        onClick={onClick}
                                        buttonIcon={!isDisabled ? ContentCopyIcon : null}
                                    />
                                )
                            })
                        }
                    </>
                }
                <DataField
                    label={'Author: '}
                    text={`${shortenHexString(proposer)}`}
                    buttonIcon={ContentCopyIcon}
                    onClick={() => copyText(proposer)}
                />
                <DataField
                    label={'Time Initiated: '}
                    text={`${getDateAsStringMMDDYYY(nanoSecondsToMiliSeconds(parseInt(timeInitiated)))}`}
                    disabled={true}
                />
                <DataField
                    label={'Time Voting Concludes: '}
                    text={`${getDateAsStringMMDDYYY(nanoSecondsToMiliSeconds(parseInt(timeVotingPeriodEnds)))}`}
                    disabled={true}
                />
            </Grid>
            { actionType === PROPOSAL_ACTIONS.IncreaseNeuron && displayHypotheticalTreasuryData() }
            <Grid 
                columns={12}
                xs={12} 
                rowSpacing={0} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"} 
            >
                <Typography variant="h6">Voting Report</Typography>
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                    <DataField
                        label={'Votes To Adopt: '}
                        text={`${numberOfYays}`}
                        onClick={() => {}}
                        disabled={true}
                    />
                    <DataField
                        label={'Voting Power: '}
                        text={`${round2Decimals(fromE8s(parseInt(yay)))}`}
                        onClick={() => {}}
                        disabled={true}
                    />
                </Grid>
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                    <DataField
                        label={'Votes To Reject: '}
                        text={`${numberOfNays}`}
                        onClick={() => {}}
                        disabled={true}
                    />
                    <DataField
                        label={'Voting Power: '}
                        text={`${round2Decimals(fromE8s(parseInt(nay)))}`}
                        onClick={() => {}}
                        disabled={true}
                    />
                </Grid>
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                    <DataField
                        label={'Total Votes: '}
                        text={`${totalVotes}`}
                        onClick={() => {}}
                        disabled={true}
                    />
                    <DataField
                        label={'Total Voting Power: '}
                        text={`${round2Decimals(fromE8s(parseInt(totalParticipated)))}`}
                        onClick={() => {}}
                        disabled={true}
                    />
                </Grid>
                { timeRemainingInNanoseconds > 0 && 
                    <Grid xs={12} width={"97%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                            <ButtonField
                                text={"Adopt"}
                                onClick={() => onVote(true)}
                                Icon={ThumbUpIcon}
                                active={true}
                            />
                        </Grid>
                        <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>
                            <ButtonField
                                text={"Reject"}
                                onClick={() => onVote(false)}
                                Icon={ThumbDownIcon}
                                active={true}
                            />
                        </Grid>
                    </Grid>
                }
                { finalized ? 
                    <DataField
                        label={'Executed: '}
                        text={`${executed ? "True" : "False"}`}
                        onClick={() => {}}
                        disabled={true}
                    /> :
                    <>
                        { CYCLES_COSTS_ASSOCIATED_WITH_ACTIONS.includes(actionType) &&
                            <Typography marginTop={"30px"} variant="h6">NOTE: This proposal consumes ~ 0.25 T cycles if approved by the DAO</Typography>
                        }
                    </>
                }
            </Grid>
            <ModalComponent
            {...modalProps}
            open={modalIsOpen} 
            isLoading={isLoadingModal} 
            />
        </Grid>
    )
};

export default Proposal;