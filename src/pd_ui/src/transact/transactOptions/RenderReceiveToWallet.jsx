import React, {useContext} from 'react';
import { AppContext } from "../../Context";
import DataField from '../../components/DataField';
import Grid from '@mui/material/Unstable_Grid2';
import { inTrillions, round2Decimals, shortenHexString } from '../../functionsAndConstants/Utils';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DisplayQrCode from './RenderQrCode';
import { copyText } from '../../functionsAndConstants/Utils';
import { Divider } from '@mui/material';
import { CONTRAST_COLOR, DIVIDER_SX, WHITE_COLOR } from '../../Theme';


const RenderReceiveData = (props) => {

    const { journalState, walletState } = useContext(AppContext);
    const { userMetaData } = journalState;
    const { cyclesBalance, rootCanisterPrincipal } = userMetaData;

    return (
        <Grid columns={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} width={"100%"}>
            
            <DisplayQrCode/>
            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}}/>
            <Grid width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={"0"}>
            <DataField
                label={'Wallet Address '}
                text={`${shortenHexString(walletState.walletData.address)}`}
                isLoading={!walletState.dataHasBeenLoaded}
                onClick={() => copyText( walletState.walletData.address )}
                labelColor={WHITE_COLOR}
                buttonColor={CONTRAST_COLOR}
                buttonIcon={ContentCopyIcon}
                transparentBackground={true}
                transparentBorder={true}
            />
            </Grid>
            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}}/>
            <Grid container columns={12} xs={11} rowSpacing={8} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} width={"100%"}>
                <DataField
                    label={`Canister ID (${round2Decimals(inTrillions(cyclesBalance))} T Cycles) `}
                    text={`${shortenHexString(rootCanisterPrincipal)}`}
                    buttonIcon={ContentCopyIcon}
                    buttonColor={WHITE_COLOR}
                    labelColor={WHITE_COLOR}
                    onClick={() => copyText(rootCanisterPrincipal)}
                    transparentBackground={true}
                    transparentBorder={true}
                />
            </Grid>
            
        </Grid>
    )

};

export default RenderReceiveData;