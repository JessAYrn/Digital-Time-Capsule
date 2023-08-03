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

    let sx = { position: 'absolute', bottom: 16, right: 16 };
    if(position === SpeedDialPositions.bottomLeft) sx = { position: 'absolute', bottom: 16, left: 16 };
    else if(position === SpeedDialPositions.topRight) sx = { position: 'absolute', top: 16, right: 16 };
    else if(position === SpeedDialPositions.topLeft) sx = { position: 'absolute', top: 16, left: 16 };

    return (
        <Box sx={{ height: 320, transform: 'translateZ(0px)', flexGrow: 1 }}>
            <SpeedDial
                ariaLabel="SpeedDial basic example"
                sx={sx}
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