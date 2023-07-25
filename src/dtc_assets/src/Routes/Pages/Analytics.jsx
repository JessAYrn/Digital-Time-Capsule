import React, { useContext, useState} from 'react';
import { AppContext } from '../HomePage';
import { NavBar } from '../../Components/navigation/NavBar';
import { UI_CONTEXTS } from '../../functionsAndConstants/Contexts';
import { Modal } from './modalContent/Modal';
import "./Analytics.scss"
import DataField from '../../Components/Fields/DataField';
import LoadScreen from './LoadScreen';
import { types } from '../../reducers/journalReducer';
import { MODALS_TYPES } from '../../functionsAndConstants/Constants';
import Switch from '../../Components/Fields/Switch';
import { CANISTER_DATA_FIELDS } from '../../functionsAndConstants/Constants';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import Paper from '@mui/material/Paper';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import ButtonField from '../../Components/Fields/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Grid from '@mui/material/Unstable_Grid2';
import AccordionField from '../../Components/Fields/Accordion';
import "../../SCSS/scrollable.scss";
import '../../SCSS/container.scss';
import '../../SCSS/contentContainer.scss'
import '../../SCSS/section.scss'
import {homePageTypes} from '../../reducers/homePageReducer';
import { inTrillions, round2Decimals, shortenHexString } from '../../functionsAndConstants/Utils';
import { copyWalletAddressHelper } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import DataTable from '../../Components/Fields/Table';
import { mapRequestsForAccessToTableRows, mapUsersProfileDataToTableRows, requestsForAccessTableColumns, usersTableColumns } from '../../mappers/dashboardMapperFunctions';
import { Typography } from '@mui/material';


const Analytics = () => {
    const { journalState, journalDispatch, homePageDispatch, homePageState, actorDispatch, actorState} = useContext(AppContext);
    const [requestsTableIsLoading, setRequestsTableIsLoading] = useState(false);
    const [usersTableIsLoading, setUsersTableIsLoading] = useState(false);

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
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success = false;
        let result = await actorState.backendActor.toggleAcceptRequest();
        if('ok' in result)  {
            success = true;
            homePageDispatch({
                actionType: homePageTypes.SET_CANISTER_DATA,
                payload: { ...homePageState.canisterData, acceptingRequests: !homePageState.canisterData.acceptingRequests }
            });
        }
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        });
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleSupportMode = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success = false;
        let result = await actorState.backendActor.toggleSupportMode();
        if('ok' in result)  {
            success = true;
            homePageDispatch({
                actionType: homePageTypes.SET_CANISTER_DATA,
                payload: { ...homePageState.canisterData, supportMode: !homePageState.canisterData.supportMode }
            });
        }
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        });

        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    }

    const handleRegistration = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success;
        let result = await actorState.backendActor.registerOwner();
        if('err' in result) success = false;
        else success = true;
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const handleUpgrade = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success = true;
        try{
            await actorState.backendActor.upgradeApp_exceptForBackendCanister();
            await actorState.managerActor.installCode_backendCanister();
        } catch(e){
            console.log("Error: ", e);
            success = false;
        };
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleCyclesSaveMode = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success = true;
        try{
            let canisterData = await actorState.backendActor.toggleCyclesSaveMode();
            await actorState.managerActor.installCode_backendCanister(canisterData);
            homePageDispatch({
                actionType: homePageTypes.SET_CANISTER_DATA,
                payload: { ...homePageState.canisterData, cyclesSaveMode: !homePageState.canisterData.cyclesSaveMode }
            });
            
        } catch(e){
            console.log("Error: ", e);
            success = false;
        };
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    return(
        <Grid container columns={12} xs={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            {   
                journalState.modalStatus.show ?
                    <Modal context={UI_CONTEXTS.HOME_PAGE} /> : 
                    <>
                        <NavBar
                            walletLink={true}
                            journalLink={true}
                            accountLink={true}
                            dashboardLink={false}
                            notificationIcon={false}
                            context={UI_CONTEXTS.HOME_PAGE}
                        />
                        {
                            homePageState.isLoading ? 
                            <LoadScreen/> :
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
                                >
                                    <Paper className='analytics paper'>
                                        <DataField
                                            label={'Journals Created:'}
                                            text={homePageState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                                            disabled={true}
                                        />
                                        <DataField
                                            label={'Frontend Canister Principal:'}
                                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal])}`}
                                            isPrincipal={true}
                                            buttonIcon={ContentCopyIcon}
                                            onClick={
                                                () => copyWalletAddressHelper(
                                                    homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal]
                                                )
                                            }
                                        />
                                        <DataField
                                            label={'Backend Canister Principal:'}
                                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}`}
                                            isPrincipal={true}
                                            buttonIcon={ContentCopyIcon}
                                            onClick={
                                                () => copyWalletAddressHelper(
                                                    homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal]
                                                )
                                            }
                                        />
                                        <DataField
                                            label={'Cycles Burned Per Day:'}
                                            text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay]))} T`}
                                            isCycles={true}
                                            disabled={true}
                                        />
                                        <DataField
                                            label={'Frontend Cycles Balance:'}
                                            text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.currentCyclesBalance_frontend]))} T`}
                                            isCycles={true}
                                            disabled={true}
                                        />
                                        <DataField
                                            label={'Backend Cycles Balance:'}
                                            text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.currentCyclesBalance_backend]))} T`}
                                            isCycles={true}
                                            disabled={true}
                                        />
                                        <DataField
                                            label={'Canister Owner:'}
                                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.nftOwner])}`}
                                            isPrincipal={true}
                                            buttonIcon={ContentCopyIcon}
                                            onClick={
                                                () => copyWalletAddressHelper(
                                                    homePageState.canisterData[CANISTER_DATA_FIELDS.nftOwner]
                                                )
                                            }
                                        />
                                        <DataField
                                            label={'NFT ID:'}
                                            text={homePageState.canisterData[CANISTER_DATA_FIELDS.nftId]}
                                            disabled={true}
                                        />
                                    </Paper>
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
                                            title={"Principals Requesting Access"} 
                                            TitleComponent={Typography} 
                                            TextComponent={Typography}
                                            iconSize={"medium"}
                                            onClick_button_1={onGrantAccess}
                                            onClick_button_2={onDenyAccess}
                                            text_1={'Approve'}
                                            text_2={'Deny'}
                                            disabled={!homePageState.canisterData.isOwner}
                                            isLoading={requestsTableIsLoading}
                                            columns={requestsForAccessTableColumns}
                                            rows={homePageState.canisterData.requestsForAccess}
                                            Icon_1={CheckIcon}
                                            Icon_2={ClearIcon}
                                            CustomComponent={DataTable}
                                        ></div>
                                        <div 
                                            title={"DAO Participants"} 
                                            TitleComponent={Typography} 
                                            TextComponent={Typography}
                                            iconSize={"medium"}
                                            onClick_button_1={subsidize}
                                            onClick_button_2={Unsubsidize}
                                            text_1={'Subsidize'}
                                            text_2={'Unsubsidize'}
                                            disabled={!homePageState.canisterData.isOwner}
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
                                <Grid 
                                    columns={12}
                                    xs={11} 
                                    md={9}
                                    rowSpacing={0} 
                                >
                                    <Grid
                                        columns={12}
                                        xs={12} 
                                        rowSpacing={0} 
                                        display="flex" 
                                        justifyContent="center" 
                                        alignItems="center" 
                                        flexDirection={"column"}
                                    >
                                        <Switch
                                            labelLeft={"Activate Support Mode: "}
                                            disabled={!homePageState.canisterData.isOwner}
                                            checked={homePageState.canisterData.supportMode}
                                            onClick={toggleSupportMode}
                                        />
                                        <Switch
                                            checked={homePageState.canisterData.acceptingRequests}
                                            onClick={toggleAcceptRequest}
                                            disabled={!homePageState.canisterData.isOwner}
                                            labelLeft={"Receive Requests:  "}
                                        />
                                        <Switch
                                            checked={homePageState.canisterData.cyclesSaveMode}
                                            onClick={toggleCyclesSaveMode}
                                            labelLeft={'Cycles Saver Mode: '}
                                            disabled={!homePageState.canisterData.isOwner}
                                        />
                                    </Grid>
                                    <Grid
                                        columns={12}
                                        xs={12} 
                                        rowSpacing={0} 
                                        display="flex" 
                                        justifyContent="center" 
                                        alignItems="center" 
                                    >
                                        <Grid columns={12} 
                                            xs={6} 
                                            width={"100%"} 
                                            display={"flex"} 
                                            justifyContent={"left"} 
                                            alignItems={"center"}
                                        >
                                            <Grid xs={6} width={"110px"}>
                                                <ButtonField
                                                    text={'Manage'}
                                                    onClick={handleRegistration}
                                                    Icon={HowToRegIcon}
                                                    active={homePageState.canisterData.isOwner}
                                                    disabled={!homePageState.canisterData.isOwner}
                                                />
                                            </Grid>
                                        </Grid>
                                        <Grid 
                                            columns={12} 
                                            xs={6} 
                                            width={"100%"} 
                                            display={"flex"} 
                                            justifyContent={"right"} 
                                            alignItems={"center"}
                                        >
                                            <Grid xs={6} width={"110px"}>
                                                <ButtonField
                                                    Icon={UpgradeIcon}
                                                    active={homePageState.canisterData.isOwner}
                                                    text={'Upgrade'}
                                                    onClick={handleUpgrade}
                                                    disabled={!homePageState.canisterData.isOwner}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </>
                        }
                    </>
            }
        </Grid>
        
    )

}

export default Analytics;