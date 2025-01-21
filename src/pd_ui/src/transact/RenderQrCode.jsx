import React, {useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { AppContext } from "../Context";

const DisplayQrCode = (props) => {
    const { walletState } = useContext(AppContext);

    return (
        walletState?.walletData?.qrCodeImgUrl ?
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} width={"100%"}>
            <img style={{height: "225px", width: "225px"}} src={walletState.walletData.qrCodeImgUrl} alt='Wallet QR Code'/>
        </Grid> : null

    )
};

export default DisplayQrCode;