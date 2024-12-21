import React from "react";
import {Line, Bar, Pie} from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import { CHART_TYPES } from "../../functionsAndConstants/Constants";
import "./Chart.scss";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
Chart.register(...registerables);

export const getDataSetsInChartFormat = (dataPointsObjsArray, radius) => {
    let datasets = [];
    const getDataSet = (property) => {
        const data = dataPointsObjsArray.map((dataPointsObj) => { return dataPointsObj[property] });
        const label = property;
        const boarderWidth = 0.5;
        const pointHoverRadius = 5;
        return {data, label, boarderWidth, radius, pointHoverRadius};
    };
    for(let property in dataPointsObjsArray[0]){ datasets.push(getDataSet(property)) };
    return datasets;
};

const chartOptions = {
    responsive: true, 
    color: "white",
    plugins: { 
        legend: {
          labels: {
            color: "white", 
          }
        } 
    }
};

const lineChartOptions = {
    ...chartOptions, 
    scales: {
    y: {  
      ticks: {
        color: "white",
      }
    },
    x: { 
      ticks: {
        color: "white", 
      }
    }
}}



const Graph = (props) => {

    const { type, datasets, labels, width, height, maintainAspectRatio } = props

    let Chart_ = Line;
    if(type === CHART_TYPES.bar) Chart_ = Bar;
    if (type === CHART_TYPES.pie) Chart_ = Pie;

    let options = type === CHART_TYPES.line ? lineChartOptions : chartOptions;
    options = {...options, maintainAspectRatio};

    return (
        <Grid xs={12} display="flex" flexDirection={"column"} justifyContent="center" alignItems="center" padding={0} >
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
            padding={0}
            >
                <Chart_ 
                data={ {datasets, labels} } 
                options={ options }/>
            </Grid> 
        </Grid>
    )
};

export default Graph;