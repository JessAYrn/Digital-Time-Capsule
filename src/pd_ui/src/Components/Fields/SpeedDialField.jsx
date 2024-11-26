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
        <>
            <SpeedDial
                sx={{ bottom: 10, [position]: 10, position: "fixed" }}
                color="secondary"
                ariaLabel="SpeedDial basic example"
                icon={<SpeedDialIcon color="white"/>}
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
        </>
    );

};

export default SpeedDialField;