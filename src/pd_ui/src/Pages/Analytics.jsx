import React, { useContext, useMemo, useState} from 'react';
import DataField from '../Components/Fields/DataField';
import Switch from '../Components/Fields/Switch';
import { CANISTER_DATA_FIELDS, GRAPH_DISPLAY_LABELS, CHART_TYPES } from '../functionsAndConstants/Constants';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import Paper from '@mui/material/Paper';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Grid from '@mui/material/Unstable_Grid2';
import AccordionField from '../Components/Fields/Accordion';
import {homePageTypes} from '../reducers/homePageReducer';
import { fromE8s, inTrillions, round2Decimals, shortenHexString } from '../functionsAndConstants/Utils';
import { copyText } from '../functionsAndConstants/walletFunctions/CopyWalletAddress';
import DataTable from '../Components/Fields/Table';
import { mapRequestsForAccessToTableRows, mapUsersProfileDataToTableRows, requestsForAccessTableColumns, usersTableColumns } from '../mappers/dashboardMapperFunctions';
import DisplayProposals from '../Components/modalPages/proposals/DisplayAllProposals';
import { AppContext } from '../Context';
import Graph, { getDataSetsInChartFormat } from '../Components/Fields/Chart';
import { Typography } from '@mui/material';

const Analytics = (props) => {

    const { homePageDispatch, homePageState, navigationAndApiState, treasuryState, setModalIsOpen, setModalIsLoading } = useContext(AppContext);

    const [requestsTableIsLoading, setRequestsTableIsLoading] = useState(false);
    const [usersTableIsLoading, setUsersTableIsLoading] = useState(false);

    let activeProposal = homePageState?.canisterData?.proposals?.filter(proposal => !proposal[1].finalized);
    let inactiveProposals = homePageState?.canisterData?.proposals?.filter(proposal => proposal[1].finalized);

    const onGrantAccess = async (args) => {
        setRequestsTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.grantAccess(principals);
        result = mapRequestsForAccessToTableRows(result);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, requestsForAccess: result }
        });
        setRequestsTableIsLoading(false)
    };

    const onDenyAccess = async (args) => {
        setRequestsTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.removeFromRequestsList(principals);
        result = mapRequestsForAccessToTableRows(result);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, requestsForAccess: result }
        });
        setRequestsTableIsLoading(false);
    };

    const subsidize = async (args) => {
        setUsersTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.updateApprovalStatus(principals, true);
        result = mapUsersProfileDataToTableRows(result.ok);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, profilesMetaData: result }
        })
        setUsersTableIsLoading(false);
    };

    const Unsubsidize = async (args) => {
        setUsersTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.updateApprovalStatus(principals, false);
        result = mapUsersProfileDataToTableRows(result.ok);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, profilesMetaData: result }
        })
        setUsersTableIsLoading(false);
    };

    const toggleAcceptRequest = async () => {
        setModalIsLoading(true);
        setModalIsOpen(true);
        let result = await navigationAndApiState.backendActor.toggleAcceptRequest();
        setModalIsOpen(false);
        setModalIsLoading(false);
        if('err' in result) return;
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, acceptingRequests: !homePageState.canisterData.acceptingRequests }
        });
    };

    const {labels, datasets} = useMemo(() => {
        const labels = [];
        const dataPointsObjsArray = [];
        for(let [principal, { balances: balancesObj }] of treasuryState?.usersTreasuryDataArray){
            labels.push(homePageState?.canisterData?.userNames[principal]);
            for(let property in balancesObj) balancesObj[property] = fromE8s(balancesObj[property]);
            dataPointsObjsArray.push(balancesObj)
        };
        const datasets =  getDataSetsInChartFormat(dataPointsObjsArray, 125);
        const includedDataSets = [GRAPH_DISPLAY_LABELS.votingPower];
        return { labels, datasets: datasets.filter(({label}) => {return includedDataSets.includes(label)}) };
    }, [treasuryState.usersTreasuryDataArray, homePageState?.canisterData?.userNames]);

    window.scrollTo(0,0);

    return(
        <>
            <Grid columns={12} xs={11} md={9} rowSpacing={0} padding={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} flexDirection={"column"} width={"100%"} >
                    <Typography variant="h4" color="white" marginBottom={"10px"} marginTop={"10px"} textAlign={"center"}>
                        Voting Power Distribution
                    </Typography>
                    <Graph
                        withoutPaper={true}
                        type={CHART_TYPES.pie}
                        datasets={datasets}
                        labels={labels}
                        height={"500px"}
                        maintainAspectRatio={false}
                        hideButton1={true}
                        hideButton2={true}
                    />  
                </Grid>
                <Grid xs={12} paddingBottom={5} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                    <AccordionField>
                    <div 
                        title={"Active Proposals"} 
                        proposals={activeProposal}
                        CustomComponent={DisplayProposals}
                    ></div>
                    <div 
                        title={"Inactive Proposals"} 
                        proposals={inactiveProposals}
                        CustomComponent={DisplayProposals}
                    ></div>
                    </AccordionField>
                </Grid>
                <Grid xs={12} paddingBottom={5} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                    <AccordionField>
                        <div 
                            title={"DAO Participants"} 
                            iconSize={"medium"}
                            onClick_button_1={subsidize}
                            onClick_button_2={Unsubsidize}
                            onCellClick={(e) => { if(e === "yes" || e === "no") return; else copyText(e)}}
                            text_1={'Subsidize'}
                            text_2={'Unsubsidize'}
                            transparent={true}
                            checkboxSelection={true}
                            disabled={!homePageState.canisterData.isAdmin}
                            isLoading={usersTableIsLoading}
                            columns={usersTableColumns}
                            rows={homePageState.canisterData.profilesMetaData}
                            Icon_1={CheckIcon}
                            Icon_2={ClearIcon}
                            CustomComponent={DataTable}
                        ></div>
                            <div 
                            title={"Principals Requesting Access"} 
                            iconSize={"medium"}
                            onClick_button_1={onGrantAccess}
                            onClick_button_2={onDenyAccess}
                            text_1={'Approve'}
                            text_2={'Deny'}
                            onCellClick={(e) => { if(e === "yes" || e === "no") return; else copyText(e)}}
                            transparent={true}
                            checkboxSelection={true}
                            disabled={!homePageState.canisterData.isAdmin}
                            isLoading={requestsTableIsLoading}
                            columns={requestsForAccessTableColumns}
                            rows={homePageState.canisterData.requestsForAccess}
                            Icon_1={CheckIcon}
                            Icon_2={ClearIcon}
                            CustomComponent={DataTable}
                        ></div>
                    </AccordionField>
                </Grid>
                <Paper sx={{ width: "100%", backgroundColor: "rgba(52,52,52, 0.8)" }}>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Accounts Created:'}
                            text={homePageState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'DAO Entry Cost:'}
                            text={`${fromE8s(homePageState.canisterData[CANISTER_DATA_FIELDS.costToEnterDao]) } ICP `}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Privacy Setting:'}
                            text={homePageState.canisterData[CANISTER_DATA_FIELDS.daoIsPublic] ? "Public":"Private"}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Frontend Canister Principal:'}
                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal])}`}
                            buttonIcon={ContentCopyIcon}
                            onClick={() => copyText( homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal] )}
                        />
                        <DataField
                            label={'Backend Canister Principal:'}
                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}`}
                            buttonIcon={ContentCopyIcon}
                            onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}
                        />
                        <DataField
                            label={'Treasury Canister Principal:'}
                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}`}
                            buttonIcon={ContentCopyIcon}
                            onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}
                        />
                        <DataField
                            label={'Manager Canister Principal:'}
                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}`}
                            buttonIcon={ContentCopyIcon}
                            onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Frontend Cycles Balance:'}
                            text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_frontend))} T`}
                            isCycles={true}
                            disabled={true}
                        />
                        <DataField
                            label={'Backend Cycles Balance:'}
                            text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_backend))} T`}
                            isCycles={true}
                            disabled={true}
                        />
                        <DataField
                            label={'Treasury Cycles Balance:'}
                            text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_treasury))} T`}
                            isCycles={true}
                            disabled={true}
                        />
                        <DataField
                            label={'Manager Cycles Balance:'}
                            text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_manager))} T`}
                            isCycles={true}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Cycles Burned Per Day:'}
                            text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay]))} T`}
                            isCycles={true}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Release Version Downloaded:'}
                            text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.releaseVersionLoaded]}`}
                            isCycles={true}
                            disabled={true}
                        />
                        <DataField
                            label={'Release Version Installed:'}
                            text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.releaseVersionInstalled]}`}
                            isCycles={true}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Support Mode:'}
                            text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.supportMode]? "Enabled" : "Disabled"}`}
                            disabled={true}
                        />
                    </Grid>
                </Paper>
                <Grid columns={12} xs={12} rowSpacing={0} padding={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
                    <Switch
                        checked={homePageState.canisterData.acceptingRequests}
                        onClick={toggleAcceptRequest}
                        disabled={!homePageState.canisterData.isAdmin}
                        labelLeft={"Receive Requests:  "}
                    />
                </Grid>
            </Grid>    
        </>   
    )

}

export default Analytics;