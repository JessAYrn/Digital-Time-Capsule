import React, {useState} from "react";
import MenuField from "../Fields/MenuField";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { PROPOSAL_ACTIONS } from "./constants";
import InputBox from "../Fields/InputBox";
import { Typography } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';



const CreateProposalForm = (props) => {

    const [proposalAction, setProposalAction] = useState(null);
    const [payload, setPayload] = useState(null);

    const mainMenuItemProps = [
        { text: PROPOSAL_ACTIONS.DepositIcpToNeuron, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.DepositIcpToNeuron)},
        { text: PROPOSAL_ACTIONS.DepositIcpToTreasury, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.DepositIcpToTreasury)},
        { text: PROPOSAL_ACTIONS.PurchaseCycles, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.PurchaseCycles)},
        { text: PROPOSAL_ACTIONS.UpgradeApp, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.UpgradeApp)},
        { text: PROPOSAL_ACTIONS.AddAdmin, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.AddAdmin)},
        { text: PROPOSAL_ACTIONS.RemoveAdmin, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.RemoveAdmin)},
        { text: PROPOSAL_ACTIONS.DispurseIcpNeuron, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.DispurseIcpNeuron)},
        { text: PROPOSAL_ACTIONS.DissolveIcpNeuron, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.DissolveIcpNeuron)},
        { text: PROPOSAL_ACTIONS.SpawnIcpNeuron, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.SpawnIcpNeuron)},
        { text: PROPOSAL_ACTIONS.FollowIcpNeuron, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.FollowIcpNeuron)},
        { text: PROPOSAL_ACTIONS.ToggleCyclesSaverMode, onClick: ()  => setProposalAction(PROPOSAL_ACTIONS.ToggleCyclesSaverMode)},
    ];

    const onChange_payload = (payload_) => {
        setPayload(payload_)
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
            { proposalAction && 
                <InputBox
                    label={"Payload "}
                    rows={"1"}
                    onChange={onChange_payload}
                />
            }
        </Grid>
    )

};

export default CreateProposalForm;