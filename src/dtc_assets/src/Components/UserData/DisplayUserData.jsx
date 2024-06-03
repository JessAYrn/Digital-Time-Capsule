import React, {useContext} from 'react';
import { AppContext } from "../../Context";
import DataField from '../Fields/DataField';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ButtonField from '../Fields/Button';
import { inTrillions, round2Decimals, shortenHexString } from '../../functionsAndConstants/Utils';
import { copyText } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const DisplayUserData = (props) => {

    const {setAnchorEl} = props;

    const {
        journalState,
    } = useContext(AppContext);

    const { userMetaData } = journalState;

    const { userPrincipal, cyclesBalance, rootCanisterPrincipal } = userMetaData;

    return (
        <Grid
        columns={12} 
        rowSpacing={8} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        flexDirection={"column"}
        width={"300px"}
        >
            <Grid
            container 
            columns={12} 
            xs={11} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
            width={"100%"}
            >
                <DataField
                    label={'User ID: '}
                    text={`${shortenHexString(userPrincipal)}`}
                    buttonIcon={ContentCopyIcon}
                    buttonColor="secondary"
                    labelColor="#343434"
                    onClick={() => {
                        const promise = new Promise ((res, rej) => {setAnchorEl(null); res()});
                        promise.then(() => { copyText(userPrincipal); });
                    }}
                />
            </Grid>
            <Grid
            container 
            columns={12} 
            xs={11} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
            width={"100%"}
            >
                <DataField
                    label={`Asset Canister ID (${round2Decimals(inTrillions(cyclesBalance))} T Cycles): `}
                    text={`${shortenHexString(rootCanisterPrincipal)}`}
                    buttonIcon={ContentCopyIcon}
                    buttonColor="secondary"
                    labelColor="#343434"
                    onClick={() => {
                        const promise = new Promise ((res, rej) => {setAnchorEl(null); res()});
                        promise.then(() => { copyText(rootCanisterPrincipal); });
                    }}
                />
            </Grid>
        </Grid>
    )

};

export default DisplayUserData;