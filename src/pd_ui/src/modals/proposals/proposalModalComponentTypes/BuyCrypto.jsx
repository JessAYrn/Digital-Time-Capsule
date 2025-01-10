import React, {useState, useContext, useMemo} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Typography } from "@mui/material";
import { AppContext } from "../../../Context";
import ButtonField from "../../../components/Button";

const BuyCrypto = (props) => {

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
        <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} flexDirection={"column"}>
            <Typography width={"100%"}>
                This decentralized application requires users to stake $ICP in order to receive voting power, 
                rewards and loans. You are being redirected to a third party service to purchase $ICP that will be sent automatically 
                to your wallet here within this application upon completion of purchase.
            </Typography>
            <Grid xs={12} display={"flex"}  justifyContent={"center"} alignItems={"center"} width={"100%"} marginTop={"10px"}>
                <ButtonField text= {"Continue"} hyperLink={url} />
            </Grid>
        </Grid>
    )
};

export default BuyCrypto;