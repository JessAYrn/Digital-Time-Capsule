import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import DataField from "../Fields/DataField";
import { AppContext as WalletContext } from "../../Routes/Wallet";
import { AppContext as  TreasuryContext } from "../../Routes/Treasury";
import { AppContext as  GroupJournalContext } from "../../Routes/GroupJournal";
import { AppContext as JournalContext } from "../../Routes/App";
import { AppContext as  AccountContext } from "../../Routes/Account";
import { AppContext as  HomePageContext} from "../../Routes/HomePage";
import { nanoSecondsToMiliSeconds, getDateAsStringMMDDYYY, shortenHexString, fromE8s, round2Decimals } from "../../functionsAndConstants/Utils";
import { retrieveContext } from "../../functionsAndConstants/Contexts";
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


const Proposal = (props) => {


    const {
        context,
        proposalId,
        proposer,
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

    let actionType = getProposalType(action);
    let payload = action[actionType];
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
                { payload && 
                    <>
                        {
                            Object.keys(payload).map((key, index) => {
                                let text = payload[key];
                                let key_ = key;
                                if(key === "amount") text = fromE8s(parseInt(payload[key])) + ' ICP';
                                if(key === "percentage_to_spawn") text = `${payload[key]}%`;
                                if(key === "neuronId") text = BigInt(payload[key]).toString();
                                if(key === "followees") {text = BigInt(payload[key][0]).toString(); key_ = "followee";}
                                if(key === "topic") {text = Object.keys(NEURON_TOPICS).find(thisKey => NEURON_TOPICS[thisKey] === payload[key])}

                                return(
                                    <DataField
                                        label={key_}
                                        text={`${text}`}
                                        disabled={true}
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
                    text={`${round2Decimals(fromE8s(parseInt(yay)))} Voting Power`}
                    onClick={() => onVote(true)}
                    buttonIcon={ThumbUpIcon}
                />
                <DataField
                    label={'Reject: '}
                    onClick={() => onVote(false)}
                    text={`${round2Decimals(fromE8s(parseInt(nay)))} Voting Power`}
                    buttonIcon={ThumbDownIcon}
                />
                <DataField
                    label={'Total Voting Power Participated: '}
                    text={`${round2Decimals(fromE8s(parseInt(total)))} Voting Power`}
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