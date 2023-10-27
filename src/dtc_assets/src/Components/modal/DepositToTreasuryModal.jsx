import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { AppContext } from "../../Routes/Treasury";
import InputBox from "../Fields/InputBox";
import MenuField from "../Fields/MenuField";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { PROPOSAL_ACTIONS } from "../proposals/utils";
import DoneIcon from '@mui/icons-material/Done';
import ButtonField from "../Fields/Button";
import { isANumber, toE8s } from "../../functionsAndConstants/Utils";
import { INPUT_BOX_FORMATS } from "../../functionsAndConstants/Constants";

const DepositToTreasuryModal = (props) => {
    const {
        context,
        setModalIsOpen, 
        setModalProps, 
        setIsLoadingModal
    } = props;

    const {actorState} = useContext(AppContext);

    const [amount, setAmount] = useState(null);
    const [action, setAction] = useState(null);
    const [hasError, setHasError] = useState(true);

    const onMenuItemClick = (proposalAction) => {
        setAction(proposalAction);
    };

    const mainMenuItemProps = [
        { text: PROPOSAL_ACTIONS.DepositIcpToNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DepositIcpToNeuron)},
        { text: PROPOSAL_ACTIONS.DepositIcpToTreasury, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DepositIcpToTreasury)},
    ];

    const depositToTreasury = async () => {
        setIsLoadingModal(true);
        let currency;
        if(action === PROPOSAL_ACTIONS.DepositIcpToNeuron) currency = {Icp_staked: null};
        else if(action === PROPOSAL_ACTIONS.DepositIcpToTreasury) currency = {Icp: null};
        let result = await actorState.backendActor.depositToTreasury({amount: toE8s(amount), currency});
        setIsLoadingModal(false);
        setModalProps({});
        setModalIsOpen(false);
    };

    const onAmountChange = (value) => {
        setHasError(!isANumber(value));
        setAmount(value);
    };

    return (
        <Grid
        columns={12} 
        xs={12} 
        rowSpacing={8} 
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
            {action && 
                <InputBox
                label={"Amount To Deposit: "}
                rows={"1"}
                hasError={hasError}
                onChange={onAmountChange}
                value={amount}
                format={INPUT_BOX_FORMATS.numberFormat}
                />
            }
            {amount && !hasError &&
                <ButtonField
                Icon={DoneIcon}
                active={true}
                text={'Submit Deposit'}
                onClick={depositToTreasury}
                />
            }

        </Grid>
    )
};

export default DepositToTreasuryModal;