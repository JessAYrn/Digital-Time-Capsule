import React, {useState, useContext, useMemo} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Typography } from "@mui/material";
import { AppContext } from "../../../../Context";
import ButtonField from "../../../Fields/Button";

const BuyCrypto = (props) => {
    const {handleClose} = props;

    const {walletState} = useContext(AppContext);


    

    const url = useMemo(() => {
        const queryParams = {
            fiatAmount: 100,
            fiatType: "USD",
            coinAmount: 0,
            coinType: "ICP",
            lockFiat: "true",
            blockchain: "BTC",
            orderMode: "BUY",
            backgroundColor: "0A0A0A",
            primaryColor: "343434",
            secondaryColor: "F7931A",
            textColor: "ffffff",
            walletAddress: walletState?.walletData?.address,
        };

        const url_ = `https://checkout.banxa.com/?${Object.entries(queryParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&")}`;
        return url_;
    }, [walletState?.walletData?.address]);

    return (
        <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} marginTop={"20px"}>
            <Grid xs={6} display={"flex"}  justifyContent={"left"} alignItems={"center"} width={"100%"}>
                <ButtonField text={"Cancel"} onClick={handleClose}/>
            </Grid>
            <Grid xs={6} display={"flex"}  justifyContent={"right"} alignItems={"center"} width={"100%"}>
                <ButtonField text= {"Continue"} hyperLink={url}/>
            </Grid>
        </Grid>
    )
};

export default BuyCrypto;