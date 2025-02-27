import React, {useState, useContext, useMemo} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import DataField from "../components/DataField";
import Typography from "@mui/material/Typography";
import { nanoSecondsToMiliSeconds, getDateAsStringMMDDYYY, fromE8s, round2Decimals, milisecondsToNanoSeconds } from "../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { getProposalType, PROPOSAL_ACTIONS } from "./utils";
import CloseIcon from '@mui/icons-material/Close';
import ButtonField from "../components/Button";
import CheckIcon from '@mui/icons-material/Check';
import { AppContext } from "../Context";
import { homePageTypes } from "../reducers/homePageReducer";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import MenuField from "../components/MenuField";
import { KeyboardArrowDownIcon } from "@mui/icons-material";
import IncreaseDissolveDelay from "./renderComponents/RenderIncreaseDissolveDelay";
import IncreaseNeuron from "./renderComponents/RenderIncreaseNeuron";
import SetAmount from "./renderComponents/RenderSetAmount";
import DissolveOrDisburseNeuron from "./renderComponents/RenderDissolveOrDisburseNeuron";
import AddOrRemoveAdmin from "./renderComponents/RenderAddOrRemoveAdmin";
import FollowNeuron from "./renderComponents/RenderFollowNeuron";
import SpawnNeuron from "./renderComponents/RenderSpawnNeuron";
import NewFundingCampaign from "./renderComponents/RenderNewFundingCampaign";
import WithdrawFromMultiSigWallet from "./renderComponents/RenderWithdrawFromMultiSigWallet";
import CancelFundingCampaign from "./renderComponents/RenderCancelFundingCampaign";
import UpdateTreasuryConfigurations from "./renderComponents/RenderUpdateTreasuryConfigurations";
import { BACKGROUND_COLOR, CONTRAST_COLOR } from "../Theme";
import Divider from '@mui/material/Divider';
import { DIVIDER_SX } from "../Theme";

const DisplayProposal = (props) => {

    const { proposal } = props;
    const [proposalIdAsBigInt, proposalData] = proposal;
    const proposalId = parseInt(proposalIdAsBigInt);
    const {proposer, action, timeInitiated, executed, finalized, timeVotingPeriodEnds, votes, voteTally} = proposalData;

    const [hasVoted, setHasVoted] = useState(false);
    const { navigationAndApiState, homePageDispatch, treasuryState, setModalIsOpen, setModalIsLoading, setModalProps, homePageState } = useContext(AppContext);

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

    const timeRemainingInHours = (parseInt(timeVotingPeriodEnds) - milisecondsToNanoSeconds(Date.now())) / 3600000000000;

    let actionType = getProposalType(action);
    let payload = action[actionType];
    let {yay, nay, totalParticipated} = voteTally;

    const RenderVoteButtons = () => {

        const onConfirmVote = async (bool) => {
            setModalIsLoading(true);
            let result = await navigationAndApiState.backendActor.voteOnProposal(proposalId, bool);
            setModalIsLoading(false);
            if(result.err){
                setModalProps({
                    flexDirection: "column",
                    components: [
                        <Typography padding={"10px"} children={`Your vote could not be successfully submitted.`} />,
                        <ButtonField color={CONTRAST_COLOR} text={"Close"} Icon={CloseIcon} onClick={() => setModalIsOpen(false)} />
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
                    <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} >
                        <ButtonField gridSx={{margin: "15px", backgroundColor: CONTRAST_COLOR}} color={BACKGROUND_COLOR} text={"Confirm"} Icon={CheckIcon} onClick={() => onConfirmVote(bool)} />
                        <ButtonField gridSx={{margin: "15px"}} color={CONTRAST_COLOR} text={"Cancel"} Icon={CloseIcon} onClick={() => setModalIsOpen(false)} />
                    </Grid>
                ]
            })
        };
        
        return (
            <Grid xs={12} width={"100%"} padding={0} display={"flex"} justifyContent={"center"} alignItems={"center"} position={"fixed"} bottom={0} maxWidth={"700px"}>
                    <ButtonField
                    text={"Adopt"}
                    gridSx={{ margin: "2.5%", width: "40%", backgroundColor: CONTRAST_COLOR }}
                    onClick={() => onVote(true)}
                    Icon={ThumbUpIcon}
                    color={BACKGROUND_COLOR}
                    disabled={hasVoted}
                    />
                    <ButtonField
                        text={"Reject"}
                        gridSx={{ margin: "2.5%", width: "40%", backgroundColor: BACKGROUND_COLOR }}
                        onClick={() => onVote(false)}
                        Icon={ThumbDownIcon}
                        color={CONTRAST_COLOR}
                        disabled={hasVoted}
                    />
            </Grid>
        )
    }


    return(
        <Grid 
            xs={12} 
            rowSpacing={0} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"} 
            width={"100%"}
        >
            
            <MenuField
                xs={8}
                disabled={true}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                color={CONTRAST_COLOR}
                label={"Proposal Type"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={[{ text: actionType, onClick: ()  => {}, selected: true},]}
            />
            <Typography varient={"h6"} color={"#bdbdbd"}> {actionType} </Typography>
            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
            { actionType === PROPOSAL_ACTIONS.IncreaseDissolveDelay && <IncreaseDissolveDelay action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { actionType === PROPOSAL_ACTIONS.IncreaseNeuron && <IncreaseNeuron action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { (actionType === PROPOSAL_ACTIONS.CreateNeuron || actionType === PROPOSAL_ACTIONS.PurchaseCycles || actionType === PROPOSAL_ACTIONS.SetCostToEnterDao) && <SetAmount action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { (actionType === PROPOSAL_ACTIONS.DisburseNeuron || actionType === PROPOSAL_ACTIONS.DissolveNeuron) && <DissolveOrDisburseNeuron action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { (actionType === PROPOSAL_ACTIONS.AddAdmin || actionType === PROPOSAL_ACTIONS.RemoveAdmin) && <AddOrRemoveAdmin action={actionType} payload={payload} finalized={finalized} disabled={true}/> }
            { actionType === PROPOSAL_ACTIONS.FollowNeuron && <FollowNeuron action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { actionType === PROPOSAL_ACTIONS.SpawnNeuron && <SpawnNeuron action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { actionType === PROPOSAL_ACTIONS.CreateFundingCampaign && <NewFundingCampaign action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { actionType === PROPOSAL_ACTIONS.CancelFundingCampaign && <CancelFundingCampaign action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { actionType === PROPOSAL_ACTIONS.WithdrawFromMultiSigWallet && <WithdrawFromMultiSigWallet action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            { actionType === PROPOSAL_ACTIONS.SetTreasuryConfigurations && <UpdateTreasuryConfigurations action={actionType} payload={payload} disabled={true} finalized={finalized}/> }
            <Divider sx={{...DIVIDER_SX, marginTop: "60px", marginBottom: "60px"}} />
            <Grid
                columns={12}
                xs={12} 
                rowSpacing={0} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"} 
                width={"100%"}
            >
                { !finalized && <DataField
                    
                    label={'Voting Ends in: '}
                    text={`${round2Decimals(timeRemainingInHours)} hours`}
                    disabled={true}
                    transparentBackground={true}
                />}
                <DataField
                    label={'Author: '}
                    text={homePageState?.canisterData?.userNames[proposer]}
                    buttonIcon={ContentCopyIcon}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Time Initiated: '}
                    text={`${getDateAsStringMMDDYYY(nanoSecondsToMiliSeconds(parseInt(timeInitiated)))}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Time Voting Concludes: '}
                    text={`${getDateAsStringMMDDYYY(nanoSecondsToMiliSeconds(parseInt(timeVotingPeriodEnds)))}`}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
            <Divider sx={{...DIVIDER_SX, marginTop: "60px", marginBottom: "60px"}} />
            <Grid 
                columns={12}
                xs={12} 
                rowSpacing={0} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"} 
                width={"100%"}
            >
                <Typography variant="h6">Voting Report</Typography>
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                    <DataField
                        label={'Votes To Adopt: '}
                        text={`${numberOfYays}`}
                        onClick={() => {}}
                        disabled={true}
                        transparentBackground={true}
                    />
                    <DataField
                        label={'Voting Power: '}
                        text={`${round2Decimals(fromE8s(parseInt(yay)))}`}
                        onClick={() => {}}
                        disabled={true}
                        transparentBackground={true}
                    />
                </Grid>
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                    <DataField
                        label={'Votes To Reject: '}
                        text={`${numberOfNays}`}
                        onClick={() => {}}
                        disabled={true}
                        transparentBackground={true}
                    />
                    <DataField
                        label={'Voting Power: '}
                        text={`${round2Decimals(fromE8s(parseInt(nay)))}`}
                        onClick={() => {}}
                        disabled={true}
                        transparentBackground={true}
                    />
                </Grid>
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                    <DataField
                        label={'Total Votes: '}
                        text={`${totalVotes}`}
                        onClick={() => {}}
                        disabled={true}
                        transparentBackground={true}
                    />
                    <DataField
                        label={'Total Voting Power: '}
                        text={`${round2Decimals(fromE8s(parseInt(totalParticipated)))}`}
                        onClick={() => {}}
                        disabled={true}
                        transparentBackground={true}
                    />
                </Grid>
                { finalized && 
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "60px", marginBottom: "60px"}} />
                    <DataField
                        label={'Executed: '}
                        text={`${executed ? "True" : "False"}`}
                        onClick={() => {}}
                        disabled={true}
                        transparentBackground={true}
                    />
                </> }
            </Grid>
            { !finalized && !hasVoted && <RenderVoteButtons /> }
        </Grid>
    )
};

export default DisplayProposal;