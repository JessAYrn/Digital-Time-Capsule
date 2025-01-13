import React from "react";
import ButtonField from "./Button";
import Grid from '@mui/material/Unstable_Grid2';
import  Paper  from '@mui/material/Paper';
import { Typography } from "@mui/material";

const DataField = (props) => {
    const {
        text,
        supertext,
        label,
        onClick,
        isLoading,
        buttonIcon,
        disabled,
        labelColor,
        buttonColor,
        buttonSx,
        transparentBackground,
        transparentBorder,
        gridSx,
        buttonGridSx
    } = props;
    
    return(
        <Grid columns={12} sx={{boxShadow: "0 0 0 0", ...gridSx}} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} rowSpacing={0} paddingTop={"10px"} paddingBottom={"10px"}> 
            <Paper sx={{width: "95%", backgroundColor: "transparent", boxShadow: "0 0 0 0", color: 'primary'}} >
                <Grid container columns={12} display="flex" justifyContent="center" alignItems="center">
                    <Grid xs={6} display="flex" justifyContent="center" alignItems="center">
                        <Typography style={{width: "100%", display:"flex", justifyContent:"left", alignItems:"center", color: labelColor }}>{label}</Typography>
                    </Grid>
                    <Grid xs={6} display="flex" justifyContent="right" alignItems="center" sx={buttonGridSx}>
                        <ButtonField
                            sx={buttonSx}
                            color={buttonColor}
                            gridSx={{boxShadow: "0 0 0 0"}}
                            transparentBackground={transparentBackground || disabled}
                            transparentBorder={transparentBorder || disabled}
                            elevation={0}
                            isLoading={isLoading}
                            text={text}
                            onClick={onClick}
                            Icon={buttonIcon}
                            disabled={disabled}
                        />
                        {supertext && <Typography variant="h6">{supertext}</Typography>}
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    )
};

export default DataField;