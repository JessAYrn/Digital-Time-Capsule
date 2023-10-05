import React, {useState, useContext} from "react";
import MenuField from "../Fields/MenuField";
import { AppContext as TreasuryContext } from "../../Routes/Treasury";
import { AppContext as HomePageContext } from "../../Routes/HomePage";
import { AppContext as  WalletContext } from "../../Routes/Wallet";
import { AppContext as GroupJournalContext } from "../../Routes/GroupJournal";
import { AppContext as AccountContext } from "../../Routes/Account";
import { AppContext as JournalContext } from "../../Routes/App";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { PAYLOAD_DATA_TYPES, PROPOSAL_ACTIONS } from "./constants";
import { retrieveContext } from "../../functionsAndConstants/Contexts";
import InputBox from "../Fields/InputBox";
import { Typography } from "@mui/material";
import ButtonField from "../Fields/Button";
import DoneIcon from '@mui/icons-material/Done';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';



const CreateProposalForm = (props) => {
    const {
        context
    } = props;

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);


    const {  actorState } = useContext(AppContext);

    const [proposalAction, setProposalAction] = useState(null);
    const [proposalPayload, setProposalPayload] = useState(null);
    const [payloadRequired, setPayloadRequired] = useState(false);
    const [payloadDataType, setPayloadDataType] = useState(null);

    
    const onMenuItemClick = (proposalAction, payloadRequired, dataType) => {
        setProposalAction(proposalAction);
        setPayloadRequired(payloadRequired);
        setPayloadDataType(dataType);
    };

    const mainMenuItemProps = [
        { text: PROPOSAL_ACTIONS.DepositIcpToNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DepositIcpToNeuron, true, PAYLOAD_DATA_TYPES.nat64)},
        { text: PROPOSAL_ACTIONS.DepositIcpToTreasury, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DepositIcpToTreasury, true, PAYLOAD_DATA_TYPES.nat64)},
        { text: PROPOSAL_ACTIONS.PurchaseCycles, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.PurchaseCycles, true, PAYLOAD_DATA_TYPES.nat64)},
        { text: PROPOSAL_ACTIONS.UpgradeApp, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.UpgradeApp, false)},
        { text: PROPOSAL_ACTIONS.AddAdmin, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.AddAdmin, true, PAYLOAD_DATA_TYPES.text)},
        { text: PROPOSAL_ACTIONS.RemoveAdmin, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.RemoveAdmin, true, PAYLOAD_DATA_TYPES.text)},
        { text: PROPOSAL_ACTIONS.DispurseIcpNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DispurseIcpNeuron, true, PAYLOAD_DATA_TYPES.text)},
        { text: PROPOSAL_ACTIONS.DissolveIcpNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DissolveIcpNeuron, true, PAYLOAD_DATA_TYPES.text)},
        { text: PROPOSAL_ACTIONS.SpawnIcpNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.SpawnIcpNeuron, true, PAYLOAD_DATA_TYPES.text)},
        { text: PROPOSAL_ACTIONS.FollowIcpNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.FollowIcpNeuron, true, PAYLOAD_DATA_TYPES.text)},
        { text: PROPOSAL_ACTIONS.ToggleCyclesSaverMode, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.ToggleCyclesSaverMode)},
    ];

    const onChange_payload = (payload_) => {
        setProposalPayload(payload_)
    };

    const onSubmitProposal = async () => {
        let principal = payloadDataType === PAYLOAD_DATA_TYPES.text ? [proposalPayload] : [];
        let amount = payloadDataType === PAYLOAD_DATA_TYPES.nat64 ? [parseInt(proposalPayload)] : [];
        let payload = {principal, amount};
        let action = {[proposalAction]: null};
        let result = await actorState.backendActor.createProposal({action, payload });
        console.log(result);
    };



    return (
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
                display={"flex"}
                alignItems={"center"}
                justifyContent={"left"}
                active={true}
                color={"custom"}
                label={"Select Proposal Type"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={mainMenuItemProps}
            />
            <Typography varient={"h3"}> {proposalAction} </Typography>
            { payloadRequired &&
                <InputBox
                    label={"Payload "}
                    rows={"1"}
                    onChange={onChange_payload}
                />
            }
            { proposalAction && (!payloadRequired || (payloadRequired && proposalPayload)) &&
                <ButtonField
                    Icon={DoneIcon}
                    active={true}
                    text={'Submit proposal'}
                    onClick={onSubmitProposal}
                />
            }
        </Grid>
    )

};

export default CreateProposalForm;