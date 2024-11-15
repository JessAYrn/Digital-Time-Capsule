import React, { useMemo, useState } from "react";
import {Line, Bar, Pie} from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import { CHART_TYPES, GRAPH_DATA_SETS, GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import { Paper } from "@mui/material";
import "./Chart.scss";
import MenuField from "./MenuField";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import CellTowerIcon from '@mui/icons-material/CellTower';
import DateRangeIcon from '@mui/icons-material/DateRange';
Chart.register(...registerables);

const Graph = (props) => {
    const {
        type, 
        inputData,
        defaultLabel,
        defaultDataSetName,
        width,
        height,
        paperWidth,
        hideButton1,
        hideButton2,
        withoutPaper,
        maintainAspectRatio
    } = props

    const [dataSetName, setDataSetName] = useState(defaultDataSetName);
    const [labelDisplayed, setLabelDisplayed] = useState(defaultLabel);

    const data = useMemo(() => {
        let set = inputData[dataSetName];
        let dataset = set.datasets.find(dataset => dataset.label === labelDisplayed);
        return {...set, datasets: [dataset]};
    },[dataSetName, labelDisplayed, inputData]);



    const mainMenuItemProps_label = inputData[Object.keys(inputData)[0]]?.datasets?.map(
        ({label}) => { return {text: label, onClick: () => setLabelDisplayed(label)} }
    );

    const mainMenuItemProps_time = Object.keys(inputData)?.map(key => {
        return {text: key, onClick: () => setDataSetName(key)}
    });

    let Chart_ = Line;
    if(type === CHART_TYPES.bar) Chart_ = Bar;
    if (type === CHART_TYPES.pie) Chart_ = Pie;

    return (
        <Grid
        xs={12}
        display="flex"
        flexDirection={"column"}
        justifyContent="center" 
        alignItems="center" 
        >
            { !withoutPaper && <Paper className="chart paper" sx={{
                marginBottom: "0px", 
                width: paperWidth || "100%", 
                display: "flex", 
                justifyContent: "center",
                alignItems: "center",
            }} >
                <Grid 
                xs={12} 
                minWidth={"325px"} 
                width={width} 
                height={height}
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"} 
                position={"relative"}
                >
                <Chart_ data={data} options={ {responsive: true, maintainAspectRatio, } }/>
                </Grid> 
            </Paper>}
            { withoutPaper &&
                <Grid 
                xs={12} 
                minWidth={"325px"} 
                width={width} 
                height={height}
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"} 
                position={"relative"}
                >
                    <Chart_ data={data} options={ {responsive: true, maintainAspectRatio, } }/>
                </Grid> 
            }

            <Grid
            xs={12}
            display="flex"
            justifyContent="right" 
            alignItems="center" 
            paddingTop={0}
            >
                { !hideButton1 && <MenuField
                    MenuIcon={CellTowerIcon}
                    xs={1}
                    sx={{width: "50px"}}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"right"}
                    active={true}
                    color={"custom"}
                    menuItemProps={mainMenuItemProps_label}
                    margin={0}
                />}
                { !hideButton2 && <MenuField
                    MenuIcon={DateRangeIcon}
                    xs={1}
                    sx={{width: "50px"}}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"right"}
                    active={true}
                    color={"custom"}
                    menuItemProps={mainMenuItemProps_time}
                    margin={0}
                /> }
            </Grid>
        </Grid>
    )
};

export default Graph;