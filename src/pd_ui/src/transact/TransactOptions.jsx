import React, {useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Divider from "@mui/material/Divider";
import { DIVIDER_SX, WHITE_COLOR, CONTRAST_COLOR } from "../Theme";
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ButtonField from "../components/Button";
import { Typography } from "@mui/material";
import { AppContext } from "../Context";
import SendFromWallet from "./SendFromWallet";
import Typography from "@mui/material/Typography";
import RenderReceiveToWallet from "./RenderReceiveToWallet";
import ReceiveToWallet from "./ReceiveToWallet";
// import DepositFromWalletToTreasury from "./DepositFromWalletToTreasury";
// import WithdrawFromTreasuryToWallet from "./WithdrawFromTreasuryToWallet";
// import TransferFromTreasuryToOtherUser from "./TransferFromTreasuryToOtherUser";
// import PurchaseMoreICP from "./PurchaseMoreICP";


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

    const onDepositFromWalletToTreasury = () => { console.log("Deposit from Wallet To Treasury"); };

    const onWithdrawFromTreasuryToWallet = () => { console.log("Withdraw from Treasury To Wallet"); };

    const onTransferFromTreasuryToOtherUser = () => { console.log("Transfer from Treasury To Other User"); };

    const onPurchaseMoreICP = () => { console.log("Purchase More $ICP"); };

    return (
        <Grid xs={12} md={9} display="flex" flexDirection={"column"} justifyContent="center" alignItems="center" >
            <Typography variant="h6" sx={{color: CONTRAST_COLOR, marginBottom: "10px"}}>Wallet</Typography>
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Send from Your Wallet"} onClick={onSendFromWallet} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX}} />
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Receive to Your Wallet"} onClick={onReceiveToWallet} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX,  marginBottom: "30px"}} />
            <Typography variant="h6" sx={{color: CONTRAST_COLOR, marginBottom: "10px"}}>Treasury</Typography>
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Deposit from Your Wallet To Your Treasury Account"} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX}} />
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Withdraw from Your Treasury Account To Your Wallet"} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX}} />
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Transfer from Your Treasury Account To Other User's Treasury Account"} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
            <Divider sx={{...DIVIDER_SX,  marginBottom: "30px"}} />
            <Typography variant="h6" sx={{color: CONTRAST_COLOR, marginBottom: "10px"}}>Purchase</Typography>
            <ButtonField transparentBorder={true} color={WHITE_COLOR} transparentBackground={true} Icon={KeyboardArrowRightIcon} text={"Buy More $ICP"} gridSx={{ width: "100%"}} sx={{width: "100%"}}/>
        </Grid>
    )
}

export default TransactOptions;