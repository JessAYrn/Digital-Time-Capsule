import React, { useMemo, useState } from "react";
import {Line, Bar, Pie} from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import { CHART_TYPES, GRAPH_TIME_FRAMES, GRAPH_DISPLAY_CURRENCIES } from "../../functionsAndConstants/Constants";
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
        inputData
    } = props

    const [timeFrame, setTimeFrame] = useState(GRAPH_TIME_FRAMES.week);
    const [labelDisplayed, setLabelDisplayed] = useState(inputData[Object.keys(inputData)[0]]?.datasets[0]?.label);

    const data = useMemo(() => {
        let set = inputData[timeFrame];
        let dataset = set.datasets.find(dataset => dataset.label === labelDisplayed);
        return {...set, datasets: [dataset]};
    },[timeFrame, labelDisplayed]);

    const mainMenuItemProps_label = inputData[Object.keys(inputData)[0]]?.datasets?.map(
        ({label}) => { return {text: label, onClick: () => setLabelDisplayed(label)} }
    );

    const mainMenuItemProps_time = Object.keys(inputData)?.map(key => {
        return {text: key, onClick: () => setTimeFrame(key)}
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
            <Grid
            xs={12}
            display="flex"
            justifyContent="left" 
            alignItems="center" 
            >
                <MenuField
                    MenuIcon={CellTowerIcon}
                    xs={8}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"left"}
                    active={true}
                    color={"custom"}
                    menuItemProps={mainMenuItemProps_label}
                    margin={0}
                />
                <MenuField
                    MenuIcon={DateRangeIcon}
                    xs={8}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"right"}
                    active={true}
                    color={"custom"}
                    menuItemProps={mainMenuItemProps_time}
                    margin={0}
                />
            </Grid>
            <Paper className="chart paper">
                <Chart_ data={data}/>
            </Paper>
        </Grid>
    )
};

export default Graph;