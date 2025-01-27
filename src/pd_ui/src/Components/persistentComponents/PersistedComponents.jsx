import React from "react";
import ActionButtons from "./ActionButtons";
import NavBar from "./NavBar";
import ToolBar from "./ToolBar";
import Grid from "@mui/material/Unstable_Grid2";

const PersistedComponents = (props) => {

    return (
        <>
            <ToolBar />
            <Grid zIndex={10} position={"fixed"} bottom={0} xs={12} width={"100%"} height={"95px"} padding={0} >
                <ActionButtons /> 
                <NavBar/>
            </Grid>
        </>
    )
};

export default PersistedComponents;