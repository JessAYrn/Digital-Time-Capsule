import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Graph from "../Fields/Chart";
import { GRAPH_DATA_SETS, CHART_TYPES, GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import { mapDataMapToChartFormat } from "../../mappers/treasuryPageMapperFunctions";

const DisplayFundingCampaign = (props) => {
    const { fundingCampaign, campaignId } = props;
    const { contributions } = fundingCampaign;
    console.log(campaignId, fundingCampaign);
    return (
        <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"}>
            <Graph
                withoutPaper={true}
                width={"25%"}
                height={"400px"}
                hideButton2={true}
                type={CHART_TYPES.pie}
                defaultLabel={GRAPH_DISPLAY_LABELS.icp}
                inputData={mapDataMapToChartFormat(contributions, GRAPH_DATA_SETS.fundingCampaignContributions)}
                defaultDataSetName={GRAPH_DATA_SETS.fundingCampaignContributions}
                maintainAspectRatio={false}
            />  
        </Grid>
    );
};

export default DisplayFundingCampaign;