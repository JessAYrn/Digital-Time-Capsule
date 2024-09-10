import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Graph from "../Fields/Chart";
import { Typography } from "@mui/material";
import InputBox from "../Fields/InputBox";
import { fromE8s } from "../../functionsAndConstants/Utils";
import ButtonField from "../Fields/Button";
import DataTable from "../Fields/Table";
import { GRAPH_DATA_SETS, CHART_TYPES, GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import { mapDataMapToChartFormat } from "../../mappers/treasuryPageMapperFunctions";

const DisplayFundingCampaign = (props) => {
    const { fundingCampaign, campaignId } = props;
    const { contributions } = fundingCampaign;
    console.log(campaignId, fundingCampaign);
    return (
        <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"} flexDirection={"column"}>
            <InputBox
                value={`${fromE8s(parseInt(fundingCampaign?.goal?.icp?.e8s))} ICP` || "N/A" }
                label={"Goal"}
                disabled={true}
            />
            <InputBox
                value={`${fromE8s(parseInt(fundingCampaign?.balances?.icp?.e8s))} ICP` || "N/A" }
                label={"Raised"}
                disabled={true}
            />
            <InputBox
                value={fundingCampaign?.description }
                label={"Description"}
                disabled={true}
                rows={4}
            />
            <InputBox
                value={`${parseInt(fundingCampaign?.percentageOfDaoRewardsAllocated)}`}
                label={"Percentage of DAO rewards allocated"}
                disabled={true}
            />
            <InputBox
                value={`${fundingCampaign?.recipient?.principalId}`}
                label={"Recipient Principal ID"}
                disabled={true}
            />
            <InputBox
                value={`${fundingCampaign?.recipient?.accountId}`}
                label={"Recipient Account ID"}
                disabled={true}
            />
            <InputBox
                value={`${parseInt(fundingCampaign?.amountDisbursed.icp?.e8s)}`}
                label={"Amount Disbursed"}
                disabled={true}
            />
            <InputBox
                value={`${parseInt(fundingCampaign?.amountOwed?.icp?.e8s)}`}
                label={"Amount Owed"}
                disabled={true}
            />
            <InputBox
                value={`${parseInt(fundingCampaign?.amountRepaid?.icp?.e8s)}`}
                label={"Amount Repaid"}
                disabled={true}
            />
            
            {contributions.length > 0 &&
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
            />}

        </Grid>
    );
};

export default DisplayFundingCampaign;