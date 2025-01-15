import React, { useContext, useMemo } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import Graph from "../../../../components/Chart";
import { CHART_TYPES } from "../../../../functionsAndConstants/Constants";
import { AppContext } from "../../../../Context";
import { sortAndReduceDataMapArray, getLabelsAndDataSetsInChartFormat } from "../../../../components/Chart";
import { fromE8s } from "../../../../functionsAndConstants/Utils";


const RenderFundingCampaignContributions = (props) => {

    const { fundingCampaign } = props;
    console.log(fundingCampaign);
    const { contributions } = fundingCampaign;

    const {homePageState} = useContext(AppContext);

    // const {chartLabels, chartDataSets} = useMemo(() => {
    //     const dataMapArray = [];

    //     for(let [principal, {stake_e8s}] of contributions){
    //         const label = homePageState?.canisterData?.userNames[principal];
    //         const dataPointObj = { stake_e8s: fromE8s(parseInt(stake_e8s)) }; 
    //         dataMapArray.push([label, dataPointObj ]);
    //     };

    //     const reducedDataMapArray = sortAndReduceDataMapArray(dataMapArray, "stake_e8s", 10);
    //     const {labels: chartLabels, datasets} =  getLabelsAndDataSetsInChartFormat(reducedDataMapArray, 125);
    //     const chartDataSets = [{...datasets[0], label: GRAPH_DISPLAY_LABELS.icp_staked}]

    //     return {chartLabels, chartDataSets};
    // }, [contributions]);


    return (
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} width={"100%"}  padding={0} flexDirection={'column'}>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                <Typography width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Campaign Contributions</Typography>
            </Grid>
            {/* { !!contributions.length && 
                    <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"}>
                        <Graph
                            withoutPaper={true}
                            width={"25%"}
                            height={"400px"}
                            type={CHART_TYPES.pie}
                            labels={chartLabels}
                            datasets={chartDataSets}
                            maintainAspectRatio={false}
                        />  
                    </Grid> 
            } */}
        </Grid>
    );
};

export default RenderFundingCampaignContributions;