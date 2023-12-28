import React, {useContext} from "react";
import { AppContext } from "../../Routes/Wallet";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { RenderQrCode } from "../../functionsAndConstants/walletFunctions/GenerateQrCode";
import ButtonField from "../Fields/Button";


const DisplayQrCode = (props) => {
    const { onClose } = props;
    const { walletState } = useContext(AppContext);

    return (
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <RenderQrCode imgUrl={walletState.walletData.qrCodeImgUrl}/> 
            <ButtonField text={"close"} onClick={onClose} paperSx={{marginTop: "10px", width: "100%" }}/>
        </Grid>
    )
};

export default DisplayQrCode;