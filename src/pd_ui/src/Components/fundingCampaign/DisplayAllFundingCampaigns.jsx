import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Typography } from "@mui/material";
import DisplayFundingCampaign from "./DisplayFundingCampaign";
import Accordion from "../Fields/Accordion";

const DisplayAllFundingCampaigns = (props) => {

    const { fundingCampaigns } = props;

    return (
        fundingCampaigns && fundingCampaigns?.length > 0 ? 
        <Grid xs={12} display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
            <Accordion>
                {fundingCampaigns.map(([campaignId, campaign]) => {
                    return (
                        <div
                        title={`Funding Campaign: #${parseInt(campaignId)}`}
                        CustomComponent={DisplayFundingCampaign}
                        campaignId={campaignId} 
                        fundingCampaign={campaign}
                        />
                    );
                })}
            </Accordion>
        </Grid> : <> </>
    );


};

export default DisplayAllFundingCampaigns;