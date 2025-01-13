import React, { useContext, useState} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import AccordionField from '../../../components/Accordion'
import DataTable from '../../../components/Table';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { AppContext } from "../../../Context";
import { homePageTypes} from "../../../reducers/homePageReducer"
import { copyText } from '../../../functionsAndConstants/Utils';

const RenderDaoParticipants = () => {

    const { homePageState, homePageDispatch, navigationAndApiState } = useContext(AppContext);

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

    return (
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection={"column"} padding={0}>
            <AccordionField title={"DAO Participants"} sx={{ marginBottom: "5px", padding: "0"}}>
                {[
                    <DataTable
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
                    rows={mapUsersProfileDataToTableRows(homePageState.canisterData.profilesMetaData)}
                    Icon_1={CheckIcon}
                    Icon_2={ClearIcon}
                />
                ]}
            </AccordionField>
            <AccordionField title={"Requests for Entry"} sx={{marginBottom: "5px", padding: "0"}}>
            {[
                <DataTable
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
                    rows={mapRequestsForAccessToTableRows(homePageState.canisterData.requestsForAccess)}
                    Icon_1={CheckIcon}
                    Icon_2={ClearIcon}
                />
            ]}
            </AccordionField>
        </Grid>
    )

};

export default RenderDaoParticipants;


const mapRequestsForAccessToTableRows = (requestsForAccess) => {
    const requestsForAccess_ = requestsForAccess.map(([userPrincipal, approvalStatus], index) => {
        return {
            id: index,
            userPrincipal: userPrincipal,
            approvalStatus: approvalStatus
        }
    });
    return requestsForAccess_;
}

const mapUsersProfileDataToTableRows = (usersProfileData) => {
    const profileMetaData = usersProfileData.map((metaData, index) => {
        return {
            id: index,
            ...metaData
        }
    });
    return profileMetaData;
};

const requestsForAccessTableColumns = [
    { 
        field: 'id', 
        headerName: '#', 
        width: 90 
    },
    {
      field: 'userPrincipal',
      headerName: 'User Principal',
      width: 200,
      editable: false,
    },
    {
        field: 'approvalStatus',
        headerName: 'Approved',
        width: 200,
        type: 'boolean'
    }
];

const usersTableColumns = [
    { 
        field: 'id', 
        headerName: '#', 
        width: 90 
    },
    {
        field: 'canisterId',
        headerName: 'Root Canister',
        width: 200,
        editable: false,
    },
    {
        field: 'userName',
        headerName: 'User Name',
        width: 200,
        editable: false,
    },
    {
        field: 'approvalStatus',
        headerName: 'Subsidized',
        width: 200,
        type: 'boolean'
    }
];
