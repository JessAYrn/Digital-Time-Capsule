import React from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import DataField from "../Fields/DataField";
import { getDateAsStringMMDDYYY } from "../../functionsAndConstants/Utils";


const Proposal = (props) => {
    const {
        proposer,
        payload,
        action,
        timeInitiated,
        timeExecuted,
        votes
    } = props;

    let payload_;
    let payloadLabel;
    if(payload.principal[0]) {payload_ = payload.principal[0]; payloadLabel = "Principal: ";}
    else if(payload.amount[0]) {payload_ = payload.amount[0]; payloadLabel = "Amount: ";}

    return(
        <Grid 
            columns={12}
            xs={12} 
            rowSpacing={0} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"} 
        >
            <DataField
                label={'Action: '}
                text={`${action}`}
            />
            { payload_ && 
                <DataField
                    label={`${payloadLabel}`}
                    text={`${action}`}
                />
            }
            <DataField
                label={'Author: '}
                text={`${proposer}`}
            />
            <DataField
                label={'Time Initiated: '}
                text={`${getDateAsStringMMDDYYY(timeInitiated)}`}
            />
            <DataField
                label={'Time Executed: '}
                text={`${timeExecuted[0] ? getDateAsStringMMDDYYY(timeExecuted[0]) : "null"}`}
            />
        </Grid>
    )
};

export default Proposal;