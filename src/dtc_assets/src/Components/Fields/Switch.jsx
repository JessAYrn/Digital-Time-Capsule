import React from 'react';
import './Switch.scss';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ButtonField from './Button';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
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
        <Grid className="switchDiv" display='flex' justifyContent="center" alignItems="Center" width="100%" >
            <FormGroup className="switch">
                {labelLeft && 
                    <Grid display='flex' justifyContent="left" alignItems="Center" xs={10} className='leftLabel'>
                        <Typography color={"white"}>{labelLeft} &nbsp;</Typography>
                    </Grid>
                }
                <Grid display='flex' justifyContent="center" alignItems="Center" xs={2} className={switchClassName} >
                    {labelRight &&
                    <ButtonField
                        active={true}
                        color={"custom"}
                        transparentBackground={true}
                        Icon={checked ? CheckIcon : CloseIcon}
                        iconSize={'small'}
                        onClick={onClick}
                    />}
                    <FormControlLabel 
                        sx={{marginRight: "0px"}}
                        disabled={disabled} 
                        onChange={onClick} 
                        checked={checked} 
                        control={<Switch color={"custom"}/>} 
                    />
                    {labelLeft &&
                    <ButtonField
                        active={true}
                        transparentBackground={true}
                        Icon={checked ? CheckIcon : CloseIcon}
                        iconSize={'small'}
                        onClick={onClick}
                    />}
                </Grid>
                {labelRight && 
                    <Grid display='flex' justifyContent="right" alignItems="Center" xs={10} className='rightLabel'>
                        <Typography  color={"white"}>{labelLeft} &nbsp;</Typography>
                    </Grid>
                }
            </FormGroup>
        </Grid>
    );
};

export default SwitchField;