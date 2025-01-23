import React, { useContext, useMemo} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Typography } from "@mui/material";
import { AppContext } from "../../Context";
import ButtonField from "../../components/Button";
import { CONTRAST_COLOR } from "../../Theme";

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
            secondaryColor: CONTRAST_COLOR,
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
            <Typography width={"100%"} textAlign={"center"}>
                This decentralized application requires users to stake $ICP in order to receive voting power, 
                rewards and loans. You are being redirected to a third party service to purchase $ICP that will be sent automatically 
                to your wallet here within this application upon completion of purchase.
            </Typography>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} position={"fixed"} bottom={"10px"}>
                <ButtonField text= {"Continue"} hyperLink={url} />
            </Grid>
        </Grid>
    )
};

export default BuyCrypto;