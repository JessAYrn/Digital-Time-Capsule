import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Typography } from "@mui/material";

const DisplayFundingCampaign = (props) => {
    const { fundingCampaign, campaignId } = props;
    return (
        <Grid xs={12} display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
            <Typography variant={"h3"}>Funding Campaign</Typography>
        </Grid>
    );
};

export default DisplayFundingCampaign;