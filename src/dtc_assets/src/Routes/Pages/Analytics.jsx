import React, { useContext, useState} from 'react';
import { NavBar } from '../../Components/navigation/NavBar';
import DataField from '../../Components/Fields/DataField';
import Switch from '../../Components/Fields/Switch';
import { CANISTER_DATA_FIELDS, GRAPH_DISPLAY_LABELS, GRAPH_DATA_SETS, CHART_TYPES } from '../../functionsAndConstants/Constants';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import Paper from '@mui/material/Paper';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Grid from '@mui/material/Unstable_Grid2';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccordionField from '../../Components/Fields/Accordion';
import {homePageTypes} from '../../reducers/homePageReducer';
import {types as journalTypes} from '../../reducers/journalReducer';
import {walletTypes} from '../../reducers/walletReducer';
import {notificationsTypes} from '../../reducers/notificationsReducer';
import {treasuryTypes} from '../../reducers/treasuryReducer';
import { inTrillions, round2Decimals, shortenHexString } from '../../functionsAndConstants/Utils';
import { copyText } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import DataTable from '../../Components/Fields/Table';
import { mapRequestsForAccessToTableRows, mapUsersProfileDataToTableRows, requestsForAccessTableColumns, usersTableColumns } from '../../mappers/dashboardMapperFunctions';
import ModalComponent from '../../Components/modal/Modal';
import SpeedDialField from '../../Components/Fields/SpeedDialField';
import CreateProposalForm from '../../Components/proposals/CreateProposalForm';
import DisplayProposals from '../../Components/proposals/DisplayAllProposals';
import { AppContext } from '../../Context';
import { mapUsersTotalTreasuryStakesAndVotingPowersDataToChartFormat } from '../../mappers/treasuryPageMapperFunctions';
import Graph from '../../Components/Fields/Chart';
import { loadAllDataIntoReduxStores } from '../../functionsAndConstants/loadingFunctions';

const Analytics = (props) => {

    const { 
        homePageDispatch, 
        homePageState, 
        actorState, 
        treasuryState, 
        treasuryDispatch,
        walletState,
        walletDispatch,
        notificationsState,
        notificationsDispatch,
        journalState,
        journalDispatch,
    } = useContext(AppContext);

    const states = {homePageState, actorState, treasuryState, walletState, notificationsState, journalState,};
    const dispatches = { homePageDispatch, treasuryDispatch, walletDispatch, notificationsDispatch, journalDispatch};
    const types = { journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes};

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [requestsTableIsLoading, setRequestsTableIsLoading] = useState(false);
    const [usersTableIsLoading, setUsersTableIsLoading] = useState(false);

    let activeProposal = homePageState?.canisterData?.proposals?.filter(proposal => !proposal[1].finalized);
    let inactiveProposals = homePageState?.canisterData?.proposals?.filter(proposal => proposal[1].finalized);

    const modalForm_createProposal = [
        {
            Component: CreateProposalForm,
            props: { setModalIsOpen, setModalProps, setIsLoadingModal}
        }
    ];

    const onGrantAccess = async (args) => {
        setRequestsTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await actorState.backendActor.grantAccess(principals);
        result = mapRequestsForAccessToTableRows(result.ok);
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
        let result = await actorState.backendActor.removeFromRequestsList(principals);
        result = mapRequestsForAccessToTableRows(result.ok);
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
        let result = await actorState.backendActor.updateApprovalStatus(principals, true);
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
        let result = await actorState.backendActor.updateApprovalStatus(principals, false);
        result = mapUsersProfileDataToTableRows(result.ok);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, profilesMetaData: result }
        })
        setUsersTableIsLoading(false);
    };

    const toggleAcceptRequest = async () => {
        setIsLoadingModal(true);
        setModalIsOpen(true);
        let result = await actorState.backendActor.toggleAcceptRequest();
        setModalIsOpen(false);
        setIsLoadingModal(false);
        if('err' in result) return;
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, acceptingRequests: !homePageState.canisterData.acceptingRequests }
        });
    };

    const openProposalForm = () => {
        setModalIsOpen(true);
        setModalProps({
            components: modalForm_createProposal,
            handleClose: () => setModalIsOpen(false)
        });
    };

    const reloadData = async () => {
        setIsLoadingModal(true);
        setModalIsOpen(true);
        await loadAllDataIntoReduxStores(states, dispatches, types);
        setModalIsOpen(false);
        setIsLoadingModal(false);
    };

    const speedDialActions = [
        {name: "Refresh", icon: RefreshIcon , onClick: reloadData},
        {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm}
    ]

    return(
        <Grid 
            container 
            columns={12} 
            xs={12} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
        > 
            <NavBar/>
            <>
                <Grid 
                columns={12}
                xs={11}  
                md={9}
                rowSpacing={0} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"}
                marginTop={"60px"}
                >
                    <Paper sx={{ width: "100%", backgroundColor: "rgba(52,52,52, 0.8)" }}>
                        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                            <DataField
                                label={'Journals Created:'}
                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                                disabled={true}
                            />
                        </Grid>
                        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                            <DataField
                                label={'Frontend Canister Principal:'}
                                text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal])}`}
                                buttonIcon={ContentCopyIcon}
                                onClick={
                                    () => copyText(
                                        homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal]
                                    )
                                }
                            />
                            <DataField
                                label={'Backend Canister Principal:'}
                                text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}`}
                                buttonIcon={ContentCopyIcon}
                                onClick={
                                    () => copyText(
                                        homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal]
                                    )
                                }
                            />
                            <DataField
                                label={'Treasury Canister Principal:'}
                                text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}`}
                                buttonIcon={ContentCopyIcon}
                                onClick={
                                    () => copyText(
                                        homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal]
                                    )
                                }
                            />
                            <DataField
                                label={'Manager Canister Principal:'}
                                text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}`}
                                buttonIcon={ContentCopyIcon}
                                onClick={
                                    () => copyText(
                                        homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal]
                                    )
                                }
                            />
                        </Grid>
                        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                            <DataField
                                label={'Frontend Cycles Balance:'}
                                text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_frontend))} T`}
                                isCycles={true}
                                disabled={true}
                            />
                            <DataField
                                label={'Backend Cycles Balance:'}
                                text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_backend))} T`}
                                isCycles={true}
                                disabled={true}
                            />
                            <DataField
                                label={'Treasury Cycles Balance:'}
                                text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_treasury))} T`}
                                isCycles={true}
                                disabled={true}
                            />
                            <DataField
                                label={'Manager Cycles Balance:'}
                                text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_manager))} T`}
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
                    </Paper>
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={11} md={9} padding={0} >
                    <Graph
                        type={CHART_TYPES.pie}
                        defaultLabel={GRAPH_DISPLAY_LABELS.votingPower}
                        inputData={mapUsersTotalTreasuryStakesAndVotingPowersDataToChartFormat(treasuryState.usersTreasuryDataArray)}
                        defaultDataSetName={GRAPH_DATA_SETS.usersTotalStakesAndVotingPowers}
                        height={"500px"}
                        maintainAspectRatio={false}
                        hideButton1={true}
                        hideButton2={true}
                    />  
                </Grid>
                <Grid 
                    columns={12}
                    xs={11} 
                    md={9}
                    rowSpacing={0} 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    flexDirection={"column"}
                >
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
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
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                        <AccordionField>
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
                        </AccordionField>
                    </Grid>
                </Grid> 
                <Grid columns={12} xs={11} md={9} rowSpacing={0}>
                    <Grid columns={12} xs={12} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
                        <Switch
                            checked={homePageState.canisterData.acceptingRequests}
                            onClick={toggleAcceptRequest}
                            disabled={!homePageState.canisterData.isAdmin}
                            labelLeft={"Receive Requests:  "}
                        />
                    </Grid>
                </Grid>
                <SpeedDialField actions={speedDialActions} position={"right"}/>
            </>
            <ModalComponent 
                {...modalProps}
                open={modalIsOpen} 
                isLoading={isLoadingModal} 
            />  
        </Grid>
        
    )

}

export default Analytics;