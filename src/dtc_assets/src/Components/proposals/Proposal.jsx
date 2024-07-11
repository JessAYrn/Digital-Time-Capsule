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

const Proposal = (props) => {


    const {
        proposalId,
        proposer,
        action,
        timeInitiated,
        executed,
        timeVotingPeriodEnds,
        votes,
        voteTally
    } = props;

    const [modalProps, setModalProps] = useState({});
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoading] = useState(false);

    let numberOfNays = votes.filter(vote => vote[1].adopt === false).length;
    let numberOfYays = votes.filter(vote => vote[1].adopt === true).length;
    let totalVotes = votes.length;

    const { actorState, homePageDispatch } = useContext(AppContext);

    const timeRemainingInNanoseconds = parseInt(timeVotingPeriodEnds) - milisecondsToNanoSeconds(Date.now());
    const timeRemainingInSeconds = timeRemainingInNanoseconds / 1000000000;
    const timeRemainingInHours = timeRemainingInSeconds / 3600;

    let actionType = getProposalType(action);
    let payload = action[actionType];
    let {yay, nay, total} = voteTally;

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
                        text={`${round2Decimals(fromE8s(parseInt(total)))}`}
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
                { timeRemainingInNanoseconds < 0 && 
                    <DataField
                        label={'Executed: '}
                        text={`${executed ? "True" : "False"}`}
                        onClick={() => {}}
                        disabled={true}
                    /> 
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