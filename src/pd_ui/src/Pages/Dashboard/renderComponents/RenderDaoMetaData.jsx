import React, {useContext} from "react";
import AccordionField from '../../../components/Accordion'
import Grid from "@mui/material/Unstable_Grid2";
import DataField from '../../../components/DataField';
import { AppContext } from "../../../Context";
import { CANISTER_DATA_FIELDS } from "../../../functionsAndConstants/Constants";

import { round2Decimals, inTrillions, shortenHexString, fromE8s, copyText} from "../../../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Typography from "@mui/material/Typography";
import { Divider } from "@mui/material";
import { DIVIDER_SX } from "../../../Theme";



const RenderDaoMetaData = () => {

    const { homePageState } = useContext(AppContext);

    return (
        <Grid display={"flex"} flexDirection={"column"} width={"100%"} justifyContent={"center"} alignItems={"center"}>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} width={"100%"}>
                <DataField
                    transparentBackground={true}
                    transparentBorder={true}
                    label={'Accounts Created:'}
                    text={homePageState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                    disabled={true}
                />
                <DataField
                    label={'DAO Entry Cost:'}
                    transparentBackground={true}
                    transparentBorder={true}
                    text={`${fromE8s(homePageState.canisterData[CANISTER_DATA_FIELDS.costToEnterDao]) } ICP `}
                    disabled={true}
                />
                <DataField
                    label={'Privacy Setting:'}
                    transparentBackground={true}
                    transparentBorder={true}
                    text={homePageState.canisterData[CANISTER_DATA_FIELDS.daoIsPublic] ? "Public":"Private"}
                    disabled={true}
                />
            </Grid>
            <Divider sx={{...DIVIDER_SX, marginTop: "15px", marginBottom: "15px"}}/>
            <Grid xs={12} width={"100%"} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Frontend Canister Principal:'}
                    text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal])}`}
                    buttonIcon={ContentCopyIcon}
                    transparentBackground={true}
                    transparentBorder={true}
                    onClick={() => copyText( homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal] )}
                />
                <DataField
                    label={'Backend Canister Principal:'}
                    text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}`}
                    buttonIcon={ContentCopyIcon}
                    transparentBackground={true}
                    transparentBorder={true}
                    onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}
                />
                <DataField
                    label={'Treasury Canister Principal:'}
                    text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}`}
                    buttonIcon={ContentCopyIcon}
                    transparentBackground={true}
                    transparentBorder={true}
                    onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}
                />
                <DataField
                    label={'Manager Canister Principal:'}
                    text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}`}
                    buttonIcon={ContentCopyIcon}
                    transparentBackground={true}
                    transparentBorder={true}
                    onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}
                />
            </Grid>
            <Divider sx={{...DIVIDER_SX, marginTop: "15px", marginBottom: "15px"}}/>
            <Grid width={"100%"} xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Frontend Cycles Balance:'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_frontend))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                    transparentBorder={true}
                />
                <DataField
                    label={'Backend Cycles Balance:'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_backend))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                    transparentBorder={true}
                />
                <DataField
                    label={'Treasury Cycles Balance:'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_treasury))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                    transparentBorder={true}
                />
                <DataField
                    label={'Manager Cycles Balance:'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_manager))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                    transparentBorder={true}
                />
            </Grid>
            <Divider sx={{...DIVIDER_SX, marginTop: "15px", marginBottom: "15px"}}/>
            <Grid width={"100%"} xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Cycles Burned Per Day:'}
                    text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay]))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                    transparentBorder={true}
                />
            </Grid>
            <Divider sx={{...DIVIDER_SX, marginTop: "15px", marginBottom: "15px"}}/>
            <Grid width={"100%"} xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Release Version Downloaded:'}
                    text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.releaseVersionLoaded]}`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                    transparentBorder={true}
                />
                <DataField
                    label={'Release Version Installed:'}
                    text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.releaseVersionInstalled]}`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                    transparentBorder={true}
                />
            </Grid>
            <Divider sx={{...DIVIDER_SX, marginTop: "15px", marginBottom: "15px"}}/>
            <Grid width={"100%"} xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Support Mode:'}
                    text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.supportMode]? "Enabled" : "Disabled"}`}
                    disabled={true}
                    transparentBackground={true}
                    transparentBorder={true}
                />
            </Grid>
        </Grid>
    )
};

export default RenderDaoMetaData