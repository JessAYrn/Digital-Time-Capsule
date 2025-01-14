import React from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import RenderNeuronValues from "./RenderNeuronValues";
import RenderContributionsSection from "./RenderContributionsSection";
import { Divider } from "@mui/material";
import { DIVIDER_SX } from "../../../Theme";

const RenderNeuron = (props) => {

    const { neuronId, neuronData } = props;

    return (
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} flexDirection={"column"} padding={0}>

            <RenderNeuronValues neuronId={neuronId} neuronData={neuronData}/>
            <Divider sx={{...DIVIDER_SX, marginTop: "60px", marginBottom: "60px"}}/>
            <RenderContributionsSection neuronData={neuronData}/>
            
        </Grid>
    );

};

export default RenderNeuron;