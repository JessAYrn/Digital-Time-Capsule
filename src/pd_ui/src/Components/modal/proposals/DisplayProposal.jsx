import React, {useState, useContext, useMemo} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import DataField from "../../Fields/DataField";
import Typography from "@mui/material/Typography";
import { nanoSecondsToMiliSeconds, getDateAsStringMMDDYYY, shortenHexString, fromE8s, round2Decimals, milisecondsToNanoSeconds } from "../../../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { getProposalType } from "./utils";
import CloseIcon from '@mui/icons-material/Close';
import ButtonField from "../../Fields/Button";
import CheckIcon from '@mui/icons-material/Check';
import { copyText } from "../../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { AppContext } from "../../../Context";
import { homePageTypes } from "../../../reducers/homePageReducer";
import { PROPOSAL_ACTIONS } from "./utils";
import Graph from "../../Fields/Chart";
import { CHART_TYPES, GRAPH_DATA_SETS, GRAPH_DISPLAY_LABELS, MAX_DISSOLVE_DELAY_IN_SECONDS, MIN_DISSOLVE_DELAY_FOR_REWARDS_IN_SECONDS } from "../../../functionsAndConstants/Constants";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import MenuField from "../../Fields/MenuField";
import { KeyboardArrowDownIcon } from "@mui/icons-material";
import IncreaseDissolveDelay from "./proposalModalComponentTypes/IncreaseDissolveDelay";
import IncreaseNeuron from "./proposalModalComponentTypes/IncreaseNeuron";
import SetAmount from "./proposalModalComponentTypes/SetAmount";
import DissolveOrDisburseNeuron from "./proposalModalComponentTypes/DissolveOrDisburseNeuron";
import AddOrRemoveAdmin from "./proposalModalComponentTypes/AddOrRemoveAdmin";
import FollowNeuron from "./proposalModalComponentTypes/FollowNeuron";
import SpawnNeuron from "./proposalModalComponentTypes/SpawnNeuron";
import NewFundingCampaign from "./proposalModalComponentTypes/NewFundingCampaign";
import WithdrawFromMultiSigWallet from "./proposalModalComponentTypes/WithdrawFromMultiSigWallet";
import CancelFundingCampaign from "./proposalModalComponentTypes/CancelFundingCampaign";


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

const VOTING_POWER_REDISTRIBUTION_ACTIONS = [
    PROPOSAL_ACTIONS.IncreaseNeuron,
    PROPOSAL_ACTIONS.IncreaseDissolveDelay,
    PROPOSAL_ACTIONS.CreateNeuron

];

const DisplayProposal = (props) => {


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

    const [hasVoted, setHasVoted] = useState(false);
    const { actorState, homePageDispatch, treasuryState, setModalIsOpen, setModalIsLoading, setModalProps, homePageState } = useContext(AppContext);

    let [numberOfNays, numberOfYays, totalVotes] = useMemo(() => {
        let numberOfNays = 0;
        let numberOfYays = 0;
        let totalVotes = votes.length;

        for(let [userPrincipal, voteData] of votes) {
            voteData.adopt ? numberOfYays++ : numberOfNays++;
            if(userPrincipal === treasuryState.userPrincipal){setHasVoted(true)}
        }
        return [numberOfNays, numberOfYays, totalVotes];
    },[]);

    const timeRemainingInNanoseconds = parseInt(timeVotingPeriodEnds) - milisecondsToNanoSeconds(Date.now());
    const timeRemainingInSeconds = timeRemainingInNanoseconds / 1000000000;
    const timeRemainingInHours = timeRemainingInSeconds / 3600;

    let actionType = getProposalType(action);
    let payload = action[actionType];
    let {yay, nay, totalParticipated} = voteTally;

    const displayHypotheticalTreasuryData = () => {
        if(!VOTING_POWER_REDISTRIBUTION_ACTIONS.includes(actionType)) return;
        if(finalized) return;
        let { amount: amountToIncreaseNeuron, neuronId, additionalDissolveDelaySeconds } = payload;
        let {neurons} = treasuryState;  
        const getVotingPowerBonusMultiplier = () => {
            if(actionType === PROPOSAL_ACTIONS.CreateNeuron) return 1;
            let neuronData = neurons.icp.find(([neuronId_, _]) => neuronId_ === BigInt(neuronId).toString());
            if(!neuronData) return 1;
            let {neuronInfo} = neuronData[1];
            let {stake_e8s: neuronTotalStake, voting_power: neuronTotalVotingPower, dissolve_delay_seconds} = neuronInfo;
            if(actionType === PROPOSAL_ACTIONS.IncreaseNeuron){ 
                let currentVotingPowerBonusMultipllier = neuronTotalVotingPower / neuronTotalStake;
                return currentVotingPowerBonusMultipllier; 
            };
            if(actionType === PROPOSAL_ACTIONS.IncreaseDissolveDelay){
                let newDissolveDelay = parseInt(dissolve_delay_seconds) + parseInt(additionalDissolveDelaySeconds);
                let rewardsMultiplierRange = MAX_DISSOLVE_DELAY_IN_SECONDS - MIN_DISSOLVE_DELAY_FOR_REWARDS_IN_SECONDS;
                let elibleSecondsWithinRange = newDissolveDelay - MIN_DISSOLVE_DELAY_FOR_REWARDS_IN_SECONDS;
                if(elibleSecondsWithinRange < 0) return 1;
                let rewardsMultiplier = 1 + elibleSecondsWithinRange / rewardsMultiplierRange;
                return rewardsMultiplier;
            };
        };

        let votingPowerBonusMultipllier = getVotingPowerBonusMultiplier();
        let hypotheticalUsersTreasuryDataArray;
        let hypotheticalUsersTreasuryDataMap = {};
        treasuryState?.usersTreasuryDataArray.map(([principal, userTreasuryData]) => { hypotheticalUsersTreasuryDataMap[principal] = userTreasuryData;});

        if(actionType === PROPOSAL_ACTIONS.CreateNeuron || actionType === PROPOSAL_ACTIONS.IncreaseNeuron){
            let principalToReceiveVotingPower = !!payload?.onBehalfOf?.length ? payload?.onBehalfOf[0] : proposer;
            let recipientTreasuryData = hypotheticalUsersTreasuryDataMap[principalToReceiveVotingPower];
            if(!recipientTreasuryData) recipientTreasuryData =  {balances: {icp_staked: 0, voting_power: 0}};

            recipientTreasuryData = {
                ...recipientTreasuryData, 
                balances: {
                    ...recipientTreasuryData.balances,
                    icp_staked: recipientTreasuryData.balances.icp_staked + parseInt(amountToIncreaseNeuron), 
                    voting_power: recipientTreasuryData.balances.voting_power + (parseInt(amountToIncreaseNeuron) * parseInt(votingPowerBonusMultipllier))
                }
            };
            hypotheticalUsersTreasuryDataMap[principalToReceiveVotingPower] = recipientTreasuryData;  
            hypotheticalUsersTreasuryDataArray = Object.entries(hypotheticalUsersTreasuryDataMap);
        } else if(actionType === PROPOSAL_ACTIONS.IncreaseDissolveDelay){
            let neuronData = neurons.icp.find(([neuronId_, _]) => neuronId_ === BigInt(neuronId).toString());
            if(!neuronData) return;
            let {contributions} = neuronData[1];
            contributions.map(([principal, {stake_e8s, voting_power}]) => {
                const additionalVotingPower = parseInt(stake_e8s) * votingPowerBonusMultipllier - parseInt(voting_power);
                if(additionalVotingPower > 0) {
                    hypotheticalUsersTreasuryDataMap[principal] = {
                        ...hypotheticalUsersTreasuryDataMap[principal],
                        balances: {
                            ...hypotheticalUsersTreasuryDataMap[principal].balances,
                            voting_power: hypotheticalUsersTreasuryDataMap[principal].balances.voting_power + additionalVotingPower
                        }
                    };
                }
            });
            hypotheticalUsersTreasuryDataArray = Object.entries(hypotheticalUsersTreasuryDataMap);
        };

        return (
            <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
                <Typography variant="h6">Voting Power Distribution If Approved: </Typography>
                {/* <Graph
                    type={CHART_TYPES.pie}
                    defaultLabel={GRAPH_DISPLAY_LABELS.votingPower}
                    dataSets={mapUsersTotalTreasuryStakesAndVotingPowersDataToChartFormat(hypotheticalUsersTreasuryDataArray, homePageState?.canisterData?.userNames)}
                    defaultDataSetName={GRAPH_DATA_SETS.usersTotalStakesAndVotingPowers}
                    height={"400px"}
                    maintainAspectRatio={false}
                    hideButton1={true}
                    hideButton2={true}
                /> */}
            </Grid>
        );
    }

    const onConfirmVote = async (bool) => {
        setModalIsLoading(true);
        let result = await actorState.backendActor.voteOnProposal(proposalId, bool);
        setModalIsLoading(false);
        if(result.err){
            setModalProps({
                flexDirection: "column",
                components: [
                    <Typography padding={"10px"} children={`Your vote could not be successfully submitted.`} />,
                    <ButtonField color={"secondary"} text={"Close"} Icon={CloseIcon} onClick={() => setModalIsOpen(false)} />
                ]
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

    const onVote = (bool) => {
        const decision = bool ? "ADOPT" : "REJECT";
        setModalIsOpen(true);
        setModalProps({
            flexDirection: "column",
            components: [
                <Typography padding={"10px"} children={`Confirm your vote to ${decision} proposal #${proposalId}`} />,
                <ButtonField paperSx={{padding: "10px"}} color={"secondary"} text={"Cancel"} Icon={CloseIcon} onClick={() => setModalIsOpen(false)} />,
                <ButtonField paperSx={{padding: "10px"}} color={"secondary"} text={"Confirm"} Icon={CheckIcon} onClick={() => onConfirmVote(bool)} />,
            ]
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
                <MenuField
                    xs={8}
                    disabled={true}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    color={"secondary"}
                    label={"Proposal Type"}
                    MenuIcon={KeyboardArrowDownIcon}
                    menuItemProps={[{ text: actionType, onClick: ()  => {}, selected: true},]}
                />
                <Typography varient={"h6"} color={"#bdbdbd"}> {actionType} </Typography>
                { actionType === PROPOSAL_ACTIONS.IncreaseDissolveDelay && <IncreaseDissolveDelay action={actionType} payload={payload} disabled={true}/> }
                { actionType === PROPOSAL_ACTIONS.IncreaseNeuron && <IncreaseNeuron action={actionType} payload={payload} disabled={true}/> }
                { (actionType === PROPOSAL_ACTIONS.CreateNeuron || actionType === PROPOSAL_ACTIONS.PurchaseCycles || actionType === PROPOSAL_ACTIONS.SetCostToEnterDao) && <SetAmount action={actionType} payload={payload} disabled={true}/> }
                { (actionType === PROPOSAL_ACTIONS.DisburseNeuron || actionType === PROPOSAL_ACTIONS.DissolveNeuron) && <DissolveOrDisburseNeuron action={actionType} payload={payload} disabled={true}/> }
                { (actionType === PROPOSAL_ACTIONS.AddAdmin || actionType === PROPOSAL_ACTIONS.RemoveAdmin) && <AddOrRemoveAdmin action={actionType} payload={payload} disabled={true}/> }
                { actionType === PROPOSAL_ACTIONS.FollowNeuron && <FollowNeuron action={actionType} payload={payload} disabled={true}/> }
                { actionType === PROPOSAL_ACTIONS.SpawnNeuron && <SpawnNeuron action={actionType} payload={payload} disabled={true}/> }
                { actionType === PROPOSAL_ACTIONS.CreateFundingCampaign && <NewFundingCampaign action={actionType} payload={payload} disabled={true}/> }
                { actionType === PROPOSAL_ACTIONS.CancelFundingCampaign && <CancelFundingCampaign action={actionType} payload={payload} disabled={true}/> }
                { actionType === PROPOSAL_ACTIONS.WithdrawFromMultiSigWallet && <WithdrawFromMultiSigWallet action={actionType} payload={payload} disabled={true}/> }

                { !!(timeRemainingInNanoseconds > 0) && <DataField
                    label={'Voting Ends in: '}
                    text={`${round2Decimals(timeRemainingInHours)} hours`}
                    disabled={true}
                />}
                <DataField
                    label={'Author: '}
                    text={homePageState?.canisterData?.userNames[proposer]}
                    buttonIcon={ContentCopyIcon}
                    disabled={true}
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
            { displayHypotheticalTreasuryData() }
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
                                color={"secondary"}
                                disabled={hasVoted}
                            />
                        </Grid>
                        <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>
                            <ButtonField
                                text={"Reject"}
                                onClick={() => onVote(false)}
                                Icon={ThumbDownIcon}
                                color={"secondary"}
                                disabled={hasVoted}
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
        </Grid>
    )
};

export default DisplayProposal;