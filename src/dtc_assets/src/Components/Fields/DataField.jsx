import React from "react";
import ButtonField from "./Button";
import Grid from '@mui/material/Unstable_Grid2';
import  Paper  from '@mui/material/Paper';
import "./DataField.scss";
import { Typography } from "@mui/material";

const DataField = (props) => {
    const {
        text,
        label,
        onClick,
        isLoading,
        buttonIcon,
        disabled,
        labelColor,
        buttonColor,
    } = props;
    

    return(
        <Grid columns={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} rowSpacing={0} className={'outter-grid'}> 
            <Paper className={` dataField`} color={'secondary'}>
                <Grid container columns={12} display="flex" justifyContent="center" alignItems="center">
                    <Grid xs={6} display="flex" justifyContent="center" alignItems="center">
                        <Typography style={{width: "100%", display:"flex", justifyContent:"left", alignItems:"center", color: labelColor }}>{label}</Typography>
                    </Grid>
                    <Grid xs={6} display="flex" justifyContent="right" alignItems="center">
                        <ButtonField
                            color={buttonColor}
                            transparentBackground={true}
                            elevation={0}
                            isLoading={isLoading}
                            text={text}
                            onClick={onClick}
                            Icon={buttonIcon}
                            iconSize={'small'}
                            disabled={disabled}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    )
};

export default DataField;