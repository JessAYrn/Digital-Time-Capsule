import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import DataField from "../Fields/DataField";
import { AppContext as WalletContext } from "../../Routes/Wallet";
import { AppContext as  TreasuryContext } from "../../Routes/Treasury";
import { AppContext as  GroupJournalContext } from "../../Routes/GroupJournal";
import { AppContext as JournalContext } from "../../Routes/App";
import { AppContext as  AccountContext } from "../../Routes/Account";
import { AppContext as  HomePageContext} from "../../Routes/HomePage";
import { nanoSecondsToMiliSeconds, getDateAsStringMMDDYYY, shortenHexString } from "../../functionsAndConstants/Utils";
import { retrieveContext } from "../../functionsAndConstants/Contexts";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { getProposalType } from "./utils";
import CloseIcon from '@mui/icons-material/Close';
import ButtonField from "../Fields/Button";
import CheckIcon from '@mui/icons-material/Check';
import ModalComponent from "../modal/Modal";


const Proposal = (props) => {


    const {
        context,
        proposalId,
        proposer,
        payload,
        action,
        timeInitiated,
        timeExecuted,
        votes,
        voteTally
    } = props;

    const [modalProps, setModalProps] = useState({});
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoading] = useState(false);
    const [adoptProposal, setAdoptProposal] = useState(null);

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);

    const { actorState } = useContext(AppContext);

    let payload_;
    let payloadLabel;
    let payloadButtonIcon;
    if(payload.principal[0]) {payload_ = shortenHexString(payload.principal[0]); payloadLabel = "Principal"; payloadButtonIcon = ContentCopyIcon}
    else if(payload.amount[0]) {payload_ = payload.amount[0]; payloadLabel = "Amount";}

    let {yay, nay, total} = voteTally;

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
                onClick: async () => {
                    setIsLoading(true);
                    let result = await actorState.backendActor.voteOnProposal(proposalId, bool);
                    setIsLoading(false);
                    setModalIsOpen(false);
                }
            }}
        ]
    };

    const onVote = (bool) => {
        setAdoptProposal(bool);
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
                <DataField
                    label={'Action: '}
                    text={`${getProposalType(action)}`}
                    disabled={true}
                />
                { payload_ && 
                    <DataField
                        label={`Payload(${payloadLabel}): `}
                        text={`${payload_}`}
                        buttonIcon={payloadButtonIcon}
                    />
                }
                <DataField
                    label={'Author: '}
                    text={`${shortenHexString(proposer)}`}
                    buttonIcon={ContentCopyIcon}
                />
                <DataField
                    label={'Time Initiated: '}
                    text={`${getDateAsStringMMDDYYY(nanoSecondsToMiliSeconds(parseInt(timeInitiated)))}`}
                    disabled={true}
                />
                <DataField
                    label={'Time Executed: '}
                    text={`${timeExecuted[0] ? getDateAsStringMMDDYYY(nanoSecondsToMiliSeconds(parseInt(timeExecuted[0]))) : "null"}`}
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
                <DataField
                    label={'Adopt: '}
                    text={`${parseInt(yay)}`}
                    onClick={() => onVote(true)}
                    buttonIcon={ThumbUpIcon}
                />
                <DataField
                    label={'Reject: '}
                    onClick={() => onVote(false)}
                    text={`${parseInt(nay)}`}
                    buttonIcon={ThumbDownIcon}
                />
                <DataField
                    label={'Total Voting Power Participated: '}
                    text={`${parseInt(total)}`}
                    disabled={true}
                />
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