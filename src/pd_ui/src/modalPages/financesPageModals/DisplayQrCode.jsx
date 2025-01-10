import React, {useContext} from "react";
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { RenderQrCode } from "../../functionsAndConstants/walletFunctions/GenerateQrCode";


const DisplayQrCode = (props) => {
    const { walletState } = useContext(AppContext);

    return (
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <RenderQrCode imgUrl={walletState.walletData.qrCodeImgUrl}/> 
        </Grid>
    )
};

export default DisplayQrCode;