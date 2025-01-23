import React, {useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Divider from "@mui/material/Divider";
import { DIVIDER_SX, WHITE_COLOR, CONTRAST_COLOR } from "../Theme";
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ButtonField from "../components/Button";
import { Typography } from "@mui/material";
import { AppContext } from "../Context";
import SendFromWallet from "./transactOptions/RenderSendFromWallet";
import Typography from "@mui/material/Typography";
import RenderReceiveToWallet from "./transactOptions/RenderReceiveToWallet";
import RenderTransactWithTreasury, {ACTIONS} from "./transactOptions/RenderTransactWithTreasury";
import RenderBuyCrypto from "./transactOptions/RenderBuyCrypto";


const TransactOptions = () => {

    const { setModalIsOpen, setModalProps } = useContext(AppContext);

    const returnToTransactOptions = () => {
        setModalProps({
            components: [<TransactOptions/>],
            fullScreen: true,
            headerComponent: <Typography variant="h6">Transact Options</Typography>,
        });
    }

    const onSendFromWallet = () => { 
        setModalIsOpen(true);
        setModalProps({
            components: [<SendFromWallet/>],
            fullScreen: true,
            headerComponent: <Typography variant="h6">Send from Wallet</Typography>,
            handleReturn: returnToTransactOptions
        });
     };

    const onReceiveToWallet = () => { 
        setModalIsOpen(true);
        setModalProps({
            components: [<RenderReceiveToWallet/>],
            fullScreen: true,
            headerComponent: <Typography variant="h6">Receive to Wallet</Typography>,
            handleReturn: returnToTransactOptions
        });
    };

    const onDepositFromWalletToTreasury = () => { 
        setModalIsOpen(true);
        setModalProps({
            components: [<RenderTransactWithTreasury action={ACTIONS.DEPOSIT}/>],
            fullScreen: true,
            headerComponent: <Typography variant="h6">Deposit from Wallet to Treasury</Typography>,
            handleReturn: returnToTransactOptions
        });
    };

    const onWithdrawFromTreasuryToWallet = () => { 
        setModalIsOpen(true);
        setModalProps({
            components: [<RenderTransactWithTreasury action={ACTIONS.WITHDRAW}/>],
            fullScreen: true,
            headerComponent: <Typography variant="h6">Withdraw from Treasury to Wallet</Typography>,
            handleReturn: returnToTransactOptions
        });
    };

    const onTransferFromTreasuryToOtherUser = () => { 
        setModalIsOpen(true);
        setModalProps({
            components: [<RenderTransactWithTreasury action={ACTIONS.TRANSFER}/>],
            fullScreen: true,
            headerComponent: <Typography variant="h6">Transfer from Treasury to Other User</Typography>,
            handleReturn: returnToTransactOptions
        });
    };

    const onPurchaseMoreICP = () => { 
        setModalIsOpen(true);
        setModalProps({
            components: [<RenderBuyCrypto/>],
            fullScreen: true,
            headerComponent: <Typography variant="h6">Purchase More $ICP</Typography>,
            handleReturn: returnToTransactOptions
        });
    };

    return (
        <Grid xs={12} md={9} display="flex" flexDirection={"column"} justifyContent="center" alignItems="center" >
            <Typography variant="h6" sx={{color: CONTRAST_COLOR, marginBottom: "10px"}}>Wallet</Typography>
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Send from Your Wallet"} onClick={onSendFromWallet} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX}} />

            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Receive to Your Wallet"} onClick={onReceiveToWallet} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX,  marginBottom: "30px"}} />

            <Typography variant="h6" sx={{color: CONTRAST_COLOR, marginBottom: "10px"}}>Treasury</Typography>
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Deposit from Your Wallet To Your Treasury Account"} onClick={onDepositFromWalletToTreasury} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX}} />

            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Withdraw from Your Treasury Account To Your Wallet"} onClick={onWithdrawFromTreasuryToWallet} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX}} />

            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Transfer from Your Treasury Account To Other User's Treasury Account"} onClick={onTransferFromTreasuryToOtherUser} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX,  marginBottom: "30px"}} />

            <Typography variant="h6" sx={{color: CONTRAST_COLOR, marginBottom: "10px"}}>Purchase</Typography>
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Buy More $ICP"} onClick={onPurchaseMoreICP} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
        </Grid>
    )
}

export default TransactOptions;