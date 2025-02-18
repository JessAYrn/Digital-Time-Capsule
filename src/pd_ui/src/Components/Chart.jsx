import React from "react";
import {Line, Bar, Pie} from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import { CHART_TYPES } from "../functionsAndConstants/Constants";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
Chart.register(...registerables);

export const getLabelsAndDataSetsInChartFormat = (dataMapArray, radius, noDataPointsLabels = false) => {
    const datasets = [];
    const labels = [];
    const datasetsMap = {};

    for(let [dataPointsLabel, dataPointsObj] of dataMapArray){

      labels.push(noDataPointsLabels ?  "" :  dataPointsLabel);

      for(let dataType in dataPointsObj) {
        if(!datasetsMap[dataType]) datasetsMap[dataType] = { data: [], label: dataType, boarderWidth: 0.5, pointHoverRadius: 5, radius};
        datasetsMap[dataType].data.push(dataPointsObj[dataType])
      }
    };

    for(let dataset in datasetsMap) datasets.push(datasetsMap[dataset]);

    return {datasets, labels};
};

export const sortAndReduceDataMapArray = (dataMapArray, dataType, accumulateAfterIndex, initialValue = 0) => {
  const arraySorted = dataMapArray.sort(
    function([_, obj_a],[__, obj_b]){
    if(obj_a[dataType] > obj_b[dataType]) return -1; else return 1;
  });

  const distinguishedValues = arraySorted.slice(0,accumulateAfterIndex).map(([key, value]) => {
    return [key, {[dataType]: value[dataType]}];
  });

  const theRest = arraySorted.slice(accumulateAfterIndex);
  const theRestReduced = theRest.reduce(([_, obj_accumulator], [__, obj_currentValue]) => {
    return ["the Rest", {[dataType]: obj_accumulator[dataType] + obj_currentValue[dataType]}]
  }, ["the Rest", {[dataType]: initialValue}]);

  return distinguishedValues.concat([theRestReduced]);
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