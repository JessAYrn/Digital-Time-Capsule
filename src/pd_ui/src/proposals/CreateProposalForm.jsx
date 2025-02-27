import React, {useState, useContext} from "react";
import MenuField from "../components/MenuField";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { PROPOSAL_ACTIONS } from "./utils";
import { fromE8s  } from "../functionsAndConstants/Utils";
import { homePageTypes } from "../reducers/homePageReducer";
import { Typography } from "@mui/material";
import ButtonField from "../components/Button";
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DoneIcon from '@mui/icons-material/Done';
import { AppContext } from "../Context";
import DataField from "../components/DataField";
import NewFundingCampaign from "./renderComponents/RenderNewFundingCampaign";
import SpawnNeuron from "./renderComponents/RenderSpawnNeuron";
import FollowNeuron from "./renderComponents/RenderFollowNeuron";
import AddOrRemoveAdmin from "./renderComponents/RenderAddOrRemoveAdmin";
import DissolveOrDisburseNeuron from "./renderComponents/RenderDissolveOrDisburseNeuron";
import SetAmount from "./renderComponents/RenderSetAmount";
import IncreaseNeuron from "./renderComponents/RenderIncreaseNeuron";
import IncreaseDissolveDelay from "./renderComponents/RenderIncreaseDissolveDelay";
import CancelFundingCampaign from "./renderComponents/RenderCancelFundingCampaign";
import WithdrawFromMultiSigWallet from "./renderComponents/RenderWithdrawFromMultiSigWallet";
import UpdateTreasuryConfigurations from "./renderComponents/RenderUpdateTreasuryConfigurations";
import { sortProposals } from "../functionsAndConstants/governanceDataFunctions";
import { CONTRAST_COLOR, DIVIDER_SX, BACKGROUND_COLOR } from "../Theme";
import { Divider } from "@mui/material";

const CreateProposalForm = (props) => {
    const { proposalAction, proposalPayload } = props;

    const {  navigationAndApiState, homePageDispatch, treasuryState, walletState, setModalIsOpen, setModalProps, setModalIsLoading } = useContext(AppContext);

    const availableBalance = (treasuryState?.userTreasuryData?.balances?.icp || 0) + (walletState?.walletData?.balance || 0);

    const [proposalAction_, setProposalAction] = useState(proposalAction);
    const [proposalPayload_, setProposalPayload] = useState(proposalPayload);

    const onMenuItemClick = (proposalAction) => { setProposalPayload({}); setProposalAction(proposalAction); };

    const mainMenuItemProps = [
        { text: PROPOSAL_ACTIONS.AddAdmin, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.AddAdmin), selected: proposalAction_ === PROPOSAL_ACTIONS.AddAdmin},
        { text: PROPOSAL_ACTIONS.CancelFundingCampaign, onClick: () => onMenuItemClick(PROPOSAL_ACTIONS.CancelFundingCampaign), selected: proposalAction_ === PROPOSAL_ACTIONS.CancelFundingCampaign},
        { text: PROPOSAL_ACTIONS.CreateFundingCampaign, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.CreateFundingCampaign), selected: proposalAction_ === PROPOSAL_ACTIONS.CreateFundingCampaign},
        { text: PROPOSAL_ACTIONS.CreateNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.CreateNeuron), selected: proposalAction_ === PROPOSAL_ACTIONS.CreateNeuron},
        { text: PROPOSAL_ACTIONS.DisburseNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DisburseNeuron), selected: proposalAction_ === PROPOSAL_ACTIONS.DisburseNeuron},
        { text: PROPOSAL_ACTIONS.DissolveNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DissolveNeuron), selected: proposalAction_ === PROPOSAL_ACTIONS.DissolveNeuron},
        { text: PROPOSAL_ACTIONS.FollowNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.FollowNeuron), selected: proposalAction_ === PROPOSAL_ACTIONS.FollowNeuron},
        { text: PROPOSAL_ACTIONS.IncreaseDissolveDelay, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.IncreaseDissolveDelay), selected: proposalAction_ === PROPOSAL_ACTIONS.IncreaseDissolveDelay},
        { text: PROPOSAL_ACTIONS.IncreaseNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.IncreaseNeuron), selected: proposalAction_ === PROPOSAL_ACTIONS.IncreaseNeuron},
        { text: PROPOSAL_ACTIONS.SetTreasuryConfigurations, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.SetTreasuryConfigurations), selected: proposalAction_ === PROPOSAL_ACTIONS.SetTreasuryConfigurations},
        { text: PROPOSAL_ACTIONS.InstallUpgrades, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.InstallUpgrades), selected: proposalAction_ === PROPOSAL_ACTIONS.InstallUpgrades},
        // { text: PROPOSAL_ACTIONS.PurchaseCycles, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.PurchaseCycles), selected: proposalAction_ === PROPOSAL_ACTIONS.PurchaseCycles},
        { text: PROPOSAL_ACTIONS.RemoveAdmin, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.RemoveAdmin), selected: proposalAction_ === PROPOSAL_ACTIONS.RemoveAdmin},
        { text: PROPOSAL_ACTIONS.SetCostToEnterDao, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.SetCostToEnterDao), selected: proposalAction_ === PROPOSAL_ACTIONS.SetCostToEnterDao},
        { text: PROPOSAL_ACTIONS.SpawnNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.SpawnNeuron), selected: proposalAction_ === PROPOSAL_ACTIONS.SpawnNeuron},
        { text: PROPOSAL_ACTIONS.TogglePrivacySetting, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.TogglePrivacySetting), selected: proposalAction_ === PROPOSAL_ACTIONS.TogglePrivacySetting},
        { text: PROPOSAL_ACTIONS.ToggleSupportMode, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.ToggleSupportMode), selected: proposalAction_ === PROPOSAL_ACTIONS.ToggleSupportMode},
        { text: PROPOSAL_ACTIONS.WithdrawFromMultiSigWallet, onClick: () => onMenuItemClick(PROPOSAL_ACTIONS.WithdrawFromMultiSigWallet), selected: proposalAction_ === PROPOSAL_ACTIONS.WithdrawFromMultiSigWallet}
    ];

    const onSubmitProposal = async (action) => {
        setModalIsLoading(true);
        let result = await navigationAndApiState.backendActor.createProposal(action);
        if("err" in result){
            let errorMessagArray = Object.keys(result.err);
            let errorMessage = errorMessagArray[0];
            setModalProps({
                flexDirection: "column",
                components: [
                    <Typography padding={"10px"} variant='h6' children={`Error: ${errorMessage}`} />,
                    <ErrorOutlineIcon/>,
                    <ButtonField gridSx={{padding: "10px"}} color={CONTRAST_COLOR} text={"Close"} Icon={CloseIcon} onClick={() => setModalIsOpen(false)}/>
                ]
            });
        } else{
            let updatedProposals = sortProposals(result.ok);
            homePageDispatch({
                actionType: homePageTypes.SET_PROPOSALS_DATA,
                payload: updatedProposals
            });
            setModalIsOpen(false);
        }
        setModalIsLoading(false);
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
        width={"100%"}
        >
            <MenuField
                xs={12}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"left"}
                color={CONTRAST_COLOR}
                label={"Proposal Type"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={mainMenuItemProps}
            />
            {proposalAction_ && 
            <>
                <Typography varient={"h6"} color={"#bdbdbd"}> {proposalAction_} </Typography>
                <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
            </>}
            {
                (proposalAction_ ===  PROPOSAL_ACTIONS.IncreaseNeuron || proposalAction_ === PROPOSAL_ACTIONS.CreateNeuron) &&
                <DataField label={"Available Balance: "} text={`${fromE8s(availableBalance) } ICP`} isLoading={!treasuryState.dataHasBeenLoaded} disabled={true} transparentBackground={true}/>
            }
            { proposalAction_ === PROPOSAL_ACTIONS.PurchaseCycles || proposalAction_ === PROPOSAL_ACTIONS.WithdrawFromMultiSigWallet &&
                <DataField label={"Available Balance: "} text={`${fromE8s(treasuryState.daoWalletBalance || 0) } ICP`} isLoading={!treasuryState.dataHasBeenLoaded} disabled={true} transparentBackground={true}/>
            }
            { proposalAction_ === PROPOSAL_ACTIONS.IncreaseDissolveDelay && <IncreaseDissolveDelay onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_} /> }
            { proposalAction_ === PROPOSAL_ACTIONS.IncreaseNeuron && <IncreaseNeuron onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { (proposalAction_ === PROPOSAL_ACTIONS.CreateNeuron || proposalAction_ === PROPOSAL_ACTIONS.PurchaseCycles || proposalAction_ === PROPOSAL_ACTIONS.SetCostToEnterDao) && <SetAmount onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { (proposalAction_ === PROPOSAL_ACTIONS.DisburseNeuron || proposalAction_ === PROPOSAL_ACTIONS.DissolveNeuron) && <DissolveOrDisburseNeuron onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { (proposalAction_ === PROPOSAL_ACTIONS.AddAdmin || proposalAction_ === PROPOSAL_ACTIONS.RemoveAdmin) && <AddOrRemoveAdmin onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { proposalAction_ === PROPOSAL_ACTIONS.FollowNeuron && <FollowNeuron onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { proposalAction_ === PROPOSAL_ACTIONS.SpawnNeuron && <SpawnNeuron onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { proposalAction_ === PROPOSAL_ACTIONS.CreateFundingCampaign && <NewFundingCampaign onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { proposalAction_ === PROPOSAL_ACTIONS.CancelFundingCampaign && <CancelFundingCampaign onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { proposalAction_ === PROPOSAL_ACTIONS.WithdrawFromMultiSigWallet && <WithdrawFromMultiSigWallet onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { proposalAction_ === PROPOSAL_ACTIONS.SetTreasuryConfigurations && <UpdateTreasuryConfigurations onSubmitProposal={onSubmitProposal} action={proposalAction_} payload={proposalPayload_}/> }
            { (proposalAction_ === PROPOSAL_ACTIONS.InstallUpgrades || proposalAction_ === PROPOSAL_ACTIONS.ToggleSupportMode || proposalAction_ === PROPOSAL_ACTIONS.TogglePrivacySetting) 
                && <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} maxWidth={"700px"} bottom={0} width={"100%"} >
                    <ButtonField Icon={DoneIcon} color={BACKGROUND_COLOR} gridSx={{ margin: "2.5%", width: "95%", backgroundColor: CONTRAST_COLOR }} text={'Submit Proposal'} onClick={() => onSubmitProposal({[proposalAction_]: {}})} /> 
                </Grid> 
            }
        </Grid>
    )

};

export default CreateProposalForm;