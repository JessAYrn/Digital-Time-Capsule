import React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ButtonField from './Button';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';

const SwitchField = (props) => {
    const { checked, onClick, disabled, labelLeft, labelRight, sx } = props

    return (
        <Grid className="switchDiv" display='flex' justifyContent="center" alignItems="Center" width="100%" sx={sx}>
            <FormGroup className="switch" color='primary' sx={{width: "100%", display:"flex", justifyContent: "center", flexDirection: "row"}}>
                {labelLeft && 
                    <Grid display='flex' width={"49%"}  justifyContent="left" alignItems="Center" xs={10}>
                        <Typography color={"white"}>{labelLeft} &nbsp;</Typography>
                    </Grid>
                }
                <Grid display='flex' justifyContent={labelLeft ? 'right' : 'left'} alignItems="Center" xs={2} width={"49%"}  >
                    {labelRight &&
                    <ButtonField
                        transparentBorder={true}
                        color={"primary"}
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
                        control={<Switch color={"secondary"}/>} 
                    />
                    {labelLeft &&
                    <ButtonField
                        transparentBorder={true}
                        color={"primary"}
                        transparentBackground={true}
                        Icon={checked ? CheckIcon : CloseIcon}
                        iconSize={'small'}
                        onClick={onClick}
                    />}
                </Grid>
                {labelRight && 
                    <Grid display='flex' width={"49%"}  justifyContent="right" alignItems="Center" xs={10}>
                        <Typography  color={"white"}>{labelLeft} &nbsp;</Typography>
                    </Grid>
                }
            </FormGroup>
        </Grid>
    );
};

export default SwitchField;