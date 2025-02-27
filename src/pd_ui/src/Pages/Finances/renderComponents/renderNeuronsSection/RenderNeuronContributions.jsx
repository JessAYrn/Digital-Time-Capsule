import React, { useMemo, useContext } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Divider, Typography } from "@mui/material";
import DataTable from "../../../../components/Table";
import Graph from "../../../../components/Chart";
import { CHART_TYPES } from "../../../../functionsAndConstants/Constants";
import { GRAPH_DISPLAY_LABELS } from "../../../../functionsAndConstants/Constants";
import { AppContext } from "../../../../Context";
import { fromE8s, round8Decimals } from "../../../../functionsAndConstants/Utils";
import { sortAndReduceDataMapArray, getLabelsAndDataSetsInChartFormat } from "../../../../components/Chart";
import { DIVIDER_SX } from "../../../../Theme";

        
const RenderContributions = (props) => {
    
    const { contributions } = props;

    const {homePageState} = useContext(AppContext);

    const {chartLabels, chartDataSets} = useMemo(() => {
        const dataMapArray = [];

        for(let [principal, {stake_e8s}] of contributions){
            const label = homePageState?.canisterData?.userNames[principal];
            const dataPointObj = { stake_e8s: fromE8s(parseInt(stake_e8s)) }; 
            dataMapArray.push([label, dataPointObj ]);
        };

        const reducedDataMapArray = sortAndReduceDataMapArray(dataMapArray, "stake_e8s", 10);
        const {labels: chartLabels, datasets} =  getLabelsAndDataSetsInChartFormat(reducedDataMapArray, 125);
        const chartDataSets = [{...datasets[0], label: GRAPH_DISPLAY_LABELS.icp_staked}]

        return {chartLabels, chartDataSets};
    }, [contributions]);
    

    return (
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} width={"100%"}  padding={0} flexDirection={'column'}>
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0}>
                <Typography width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"} variant="h6">Neuron Contributions</Typography>
            </Grid>
            { !!contributions.length && 
                <>
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
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} flexDirection={"column"} width={"100%"}>
                        <DataTable
                            transparent={true}
                            columns={neuronContributionsTableColumns}
                            rows={mapNeuronContributionsToTableRows(contributions, homePageState?.canisterData?.userNames)}
                        />
                    </Grid>
                </>
            }
        </Grid>
    );
}

export default RenderContributions;

const neuronContributionsTableColumns = [
    { 
        field: 'userName', 
        headerName: 'User Name', 
        width: 150,
        editable: false
    },
    { 
        field: 'stake_e8s', 
        headerName: 'Stake', 
        width: 200,
        editable: false
    },
    { 
        field: 'voting_power', 
        headerName: 'Voting Power', 
        width: 200,
        editable: false
    },
];

const mapNeuronContributionsToTableRows = (neuronContributions, userNames) => {
    const neuronContributions_ = neuronContributions.map(([userPrincipal, {stake_e8s, voting_power}]) => {
        return {
            id: userPrincipal,
            userName: userNames[userPrincipal],
            stake_e8s: `${round8Decimals(fromE8s(parseInt(stake_e8s)))} ICP`,
            voting_power: round8Decimals(fromE8s(parseInt(voting_power)))
        }
    });
    const sortedNeuronContributions = neuronContributions_.sort(function({stake_e8s: stake_e8s_a}, {stake_e8s: stake_e8s_b}){
        if(stake_e8s_a > stake_e8s_b) return -1;
        else return 1;
    });
    return sortedNeuronContributions;
}