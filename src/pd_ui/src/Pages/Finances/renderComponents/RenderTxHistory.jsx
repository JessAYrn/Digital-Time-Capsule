import React, {useContext} from "react";
import { AppContext } from "../../../Context";
import AccordionField from "../../../components/Accordion";
import DataField from "../../../components/DataField";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {nanoSecondsToMiliSeconds, fromE8s, getDateAsString, copyText, shortenHexString } from "../../../functionsAndConstants/Utils";
import Typography from "@mui/material/Typography";
import { Divider } from "@mui/material";
import { DIVIDER_SX } from "../../../Theme";
import Grid from "@mui/material/Unstable_Grid2";

export const RenderTxHistory = () => {
    const {walletState} = useContext(AppContext);


    return (
        !!walletState?.walletData?.txHistory?.data?.length ?
        <Grid columns={12} xs={12} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} paddingTop={"15px"}>
            {walletState.walletData.txHistory.data.map(([mapKey, tx]) => {
                const {balanceDelta, increase, recipient, timeStamp, source} = tx;
                const date = getDateAsString(nanoSecondsToMiliSeconds(parseInt(timeStamp)));
                const subtitle = `${increase ? "+":"-"} ${fromE8s(balanceDelta)} ICP`
                return (
                    <>
                        <AccordionField title={date} subtitle={subtitle} sx={{marginBottom: "5px", margin: "0px", padding: "0px"}}>
                            <Typography padding={"10px"} >{new Date(nanoSecondsToMiliSeconds(parseInt(timeStamp))).toString()}</Typography>
                        <DataField label={"Source"} text={shortenHexString(source)} buttonIcon={ContentCopyIcon} onClick={() => copyText(source)}/>
                            <DataField label={"Recipient"} text={shortenHexString(recipient)} buttonIcon={ContentCopyIcon} onClick={() => copyText(recipient)}/>
                        </AccordionField>
                        <Divider sx={DIVIDER_SX}/>
                    </>
                );
            })}
        </Grid>: <Typography textAlign={"center"} variant="h6" color="primary" sx={{marginBottom: "10px"}}>No transaction history</Typography>
    )
}   

export default RenderTxHistory;