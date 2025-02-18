import React from "react";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Box } from "@mui/system";


const TabsComponent = (props) => {
    const {
        tabs,
        selectedTab,
        setSelectedTab,
        sx,
        indicatorColor
    } = props

    return (
        <Box xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"left"} sx={sx}>
            <Tabs 
                sx={{ height: "43px", minHeight: "auto"}}
                value={selectedTab} 
                onChange={(event, newValue) => setSelectedTab(newValue)} 
                aria-label="basic tabs example" 
                variant="scrollable"
                scrollButtons="auto"
                indicatorColor={indicatorColor}
            >
                { tabs.map((option) => { return <Tab value={option} label={option}/> }) }
            </Tabs>
        </Box>
    )
};

export default TabsComponent