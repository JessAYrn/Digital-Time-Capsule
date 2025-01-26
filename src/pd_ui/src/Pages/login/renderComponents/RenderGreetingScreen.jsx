import React from "react";
import Grid from "@mui/material/Unstable_Grid2";


const RenderGreetingScreen = () => {
  return (
    <Grid position="absolute" top="20%" display="flex" justifyContent="center" alignItems="center" width={"100%"}>
      <img src={"P2.svg"} alt="Greeting" height={"200px"} width={"200px"}/>
    </Grid>
  );
};

export default RenderGreetingScreen;
