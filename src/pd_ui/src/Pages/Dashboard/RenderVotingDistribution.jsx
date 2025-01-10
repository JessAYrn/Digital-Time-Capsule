import React, {useMemo, useContext} from "react";
import Graph from "../../Components/Fields/Chart";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import { CHART_TYPES } from "../../functionsAndConstants/Constants";
import { AppContext } from "../../Context";
import { sortAndReduceDataMapArray, getLabelsAndDataSetsInChartFormat } from "../../Components/Fields/Chart";
import { fromE8s } from "../../functionsAndConstants/Utils";



const RenderVotingDistributionsGraph = () => {

    const { treasuryState, homePageState } = useContext(AppContext);

    const {labels, datasets} = useMemo(() => {

        const dataMapArray = [];

        for(let [principal, { balances: {voting_power} }] of treasuryState?.usersTreasuryDataArray){
            const userName = homePageState?.canisterData?.userNames[principal];
            dataMapArray.push([userName, {voting_power: fromE8s(voting_power)}]);
        };

        const reducedDataMapArray = sortAndReduceDataMapArray(dataMapArray, "voting_power", 10);
        const {labels, datasets} =  getLabelsAndDataSetsInChartFormat(reducedDataMapArray, 125);
        return { labels, datasets };

    }, [treasuryState.usersTreasuryDataArray, homePageState?.canisterData?.userNames]);

    return (
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} flexDirection={"column"} width={"100%"} >

            <Typography variant="h4" color="white" marginBottom={"10px"} marginTop={"10px"} textAlign={"center"}>
                Voting Power Distribution
            </Typography>

            <Graph
                withoutPaper={true}
                type={CHART_TYPES.pie}
                datasets={datasets}
                labels={labels}
                height={"500px"}
                maintainAspectRatio={false}
                hideButton1={true}
                hideButton2={true}
            />  
        </Grid>
    )
};

export default RenderVotingDistributionsGraph