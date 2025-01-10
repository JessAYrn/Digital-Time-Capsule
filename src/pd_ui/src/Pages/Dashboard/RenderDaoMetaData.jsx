import React, {useContext} from "react";
import AccordionField from '../../Components/Fields/Accordion'
import Grid from "@mui/material/Unstable_Grid2";
import DataField from '../../Components/Fields/DataField';
import { AppContext } from "../../Context";
import { CANISTER_DATA_FIELDS } from "../../functionsAndConstants/Constants";
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { round2Decimals, inTrillions, shortenHexString, fromE8s} from "../../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';



const RenderDaoMetaData = () => {

    const { homePageState } = useContext(AppContext);

    return (
        <AccordionField title={"DAO Meta Data"} sx={{padding: "0px"}}>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                <DataField
                    transparentBackground={true}
                    label={'Accounts Created:'}
                    text={homePageState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                    disabled={true}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                <DataField
                    label={'DAO Entry Cost:'}
                    transparentBackground={true}
                    text={`${fromE8s(homePageState.canisterData[CANISTER_DATA_FIELDS.costToEnterDao]) } ICP `}
                    disabled={true}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Privacy Setting:'}
                    transparentBackground={true}
                    text={homePageState.canisterData[CANISTER_DATA_FIELDS.daoIsPublic] ? "Public":"Private"}
                    disabled={true}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Frontend Canister Principal:'}
                    text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal])}`}
                    buttonIcon={ContentCopyIcon}
                    transparentBackground={true}
                    onClick={() => copyText( homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal] )}
                />
                <DataField
                    label={'Backend Canister Principal:'}
                    text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}`}
                    buttonIcon={ContentCopyIcon}
                    transparentBackground={true}
                    onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}
                />
                <DataField
                    label={'Treasury Canister Principal:'}
                    text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}`}
                    buttonIcon={ContentCopyIcon}
                    transparentBackground={true}
                    onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}
                />
                <DataField
                    label={'Manager Canister Principal:'}
                    text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}`}
                    buttonIcon={ContentCopyIcon}
                    transparentBackground={true}
                    onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Frontend Cycles Balance:'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_frontend))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Backend Cycles Balance:'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_backend))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Treasury Cycles Balance:'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_treasury))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Manager Cycles Balance:'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_manager))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Cycles Burned Per Day:'}
                    text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay]))} T`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Release Version Downloaded:'}
                    text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.releaseVersionLoaded]}`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Release Version Installed:'}
                    text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.releaseVersionInstalled]}`}
                    isCycles={true}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                <DataField
                    label={'Support Mode:'}
                    text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.supportMode]? "Enabled" : "Disabled"}`}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
        </AccordionField>
    )
};

export default RenderDaoMetaData