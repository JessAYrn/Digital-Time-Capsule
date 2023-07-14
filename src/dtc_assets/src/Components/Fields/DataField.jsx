import React from "react";
import { inTrillions, round2Decimals, shortenHexString } from "../../functionsAndConstants/Utils";
import { copyWalletAddressHelper } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
        isCycles,
        isPrincipal,
        disabled
    } = props;
    
    let text_;
    if(isCycles) text_ = `${round2Decimals(inTrillions(text))} T`;
    else if(isPrincipal) text_ = shortenHexString(text);
    else text_ = text;

    const copyPrincipal = () => copyWalletAddressHelper(text);

    if(isPrincipal) onClick = copyPrincipal;

    return(
        <Paper xs={12} className={` dataField`} color={'secondary'}>
            <Grid container columns={12} display="flex" justifyContent="center" alignItems="center">
                <Grid xs={6} display="flex" justifyContent="center" alignItems="center">
                    <Typography style={{width: "80%", display:"flex", justifyContent:"left", alignItems:"center"}}>{label}</Typography>
                </Grid>
                <Grid xs={6} display="flex" justifyContent="center" alignItems="center">
                    <ButtonField
                        calledByDataFieldComponent={true}
                        elevation={0}
                        isLoading={isLoading}
                        text={text_}
                        onClick={onClick}
                        Icon={buttonIcon}
                        iconSize={'small'}
                        disabled={disabled}
                    />
                </Grid>
            </Grid>
        </Paper>
    )
};

export default DataField;