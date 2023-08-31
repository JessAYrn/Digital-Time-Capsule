import React from "react";
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import Box  from "@mui/material/Box";

export const SpeedDialPositions = {
    bottomRight: "bottom-right",
    bottomLeft: "bottom-left",
    topRight: "top-right",
    topLeft: "top-left"
};

const SpeedDialField = (props) => {
    const { actions, position  } = props;    

    return (
        <Box sx={{ 
            transform: 'translateZ(0px)', 
            flexGrow: 1, 
            position: "fixed", 
            bottom: 10, 
            [position]: 10, 
            zIndex: 10 
            }}
        >
            <SpeedDial
                sx={{
                    "& .css-1ervdh7-MuiButtonBase-root-MuiFab-root-MuiSpeedDial-fab" : {
                        backgroundColor: "#343434"
                    }
                }}
                ariaLabel="SpeedDial basic example"
                icon={<SpeedDialIcon />}
            >
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <SpeedDialAction
                            key={action.name}
                            icon={<Icon/>}
                            tooltipTitle={action.name}
                            onClick={action.onClick}
                        />
                    );
                })}
            </SpeedDial>
        </Box>
    );

};

export default SpeedDialField;