import React from 'react';
import './Switch.scss';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';

const SwitchField = (props) => {
    const {
        checked,
        onClick,
        disabled,
        labelLeft,
        labelRight,
    } = props

    let switchClassName;
    if(labelLeft) switchClassName = "switchRight";
    if(labelRight) switchClassName = "switchLeft";

    return (
        <Grid className="switchDiv" display='flex' justifyContent="center" alignItems="Center" width="100%">
            <FormGroup className="switch">
                {labelLeft && <Typography className='leftLabel' color={"white"}>{labelLeft} &nbsp;</Typography>}
                <FormControlLabel 
                    className={switchClassName}
                    disabled={disabled} 
                    onChange={onClick} 
                    checked={checked} 
                    control={<Switch color='custom'/>} 
                />
                {labelRight && <Typography className='rightLabel' color={"white"}> &nbsp;{labelRight}</Typography>}
            </FormGroup>
        </Grid>
    );
};

export default SwitchField;