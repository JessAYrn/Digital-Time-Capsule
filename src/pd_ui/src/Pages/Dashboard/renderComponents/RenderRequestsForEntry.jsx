import React, { useContext, useState} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import DataTable from '../../../components/Table';
import ButtonField from '../../../components/Button';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { AppContext } from "../../../Context";
import { homePageTypes} from "../../../reducers/homePageReducer"
import { copyText, objectsAreEqual } from '../../../functionsAndConstants/Utils';
import { BACKGROUND_COLOR, CONTRAST_COLOR } from "../../../Theme";

const RenderRequestsForEntry = () => {

    const { homePageState, homePageDispatch, navigationAndApiState } = useContext(AppContext);

    const [requestsTableIsLoading, setRequestsTableIsLoading] = useState(false);

    const [tableState, setTableState] = useState({});

    const onGrantAccess = async () => {
        setRequestsTableIsLoading(true);
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.grantAccess(principals);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, requestsForAccess: result }
        });
        setRequestsTableIsLoading(false)
    };

    const onDenyAccess = async () => {
        setRequestsTableIsLoading(true);
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

    return (
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection={"column"} padding={0}>
            <DataTable
                onCellClick={(e) => { if(e === "yes" || e === "no") return; else copyText(e)}}
                transparent={true}
                checkboxSelection={true}
                disabled={!homePageState.canisterData.isAdmin}
                columns={requestsForAccessTableColumns}
                rows={mapRequestsForAccessToTableRows(homePageState.canisterData.requestsForAccess)}
                onStateChange={(newState) => { if(!objectsAreEqual(tableState, newState)) setTableState(newState) }}
            />
            {
                !!tableState?.rowSelection?.length &&
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} position={"fixed"} bottom={0} maxWidth={"700px"}>
                        <ButtonField
                            gridSx={{margin: "2.5%", width: "40%", backgroundColor: CONTRAST_COLOR}}
                            color={BACKGROUND_COLOR}
                            onClick={onGrantAccess}
                            Icon={CheckIcon}
                            text={"Approve"}
                            disabled={!homePageState.canisterData.isAdmin}
                            isLoading={requestsTableIsLoading}
                            iconSize={"medium"}
                        />
                        <ButtonField
                            gridSx={{margin: "2.5%", width: "40%", backgroundColor: BACKGROUND_COLOR}}
                            color={CONTRAST_COLOR}
                            onClick={onDenyAccess}
                            Icon={ClearIcon}
                            text={"Deny"}
                            disabled={!homePageState.canisterData.isAdmin}
                            isLoading={requestsTableIsLoading}
                            iconSize={"medium"}
                        />
                    </Grid>
            }
        </Grid>
    )

};

export default RenderRequestsForEntry;

const mapRequestsForAccessToTableRows = (requestsForAccess) => {
    const requestsForAccess_ = requestsForAccess.map(([userPrincipal, {approved}], index) => {
        return {
            id: index,
            userPrincipal: userPrincipal,
            approvalStatus: approved
        }
    });
    return requestsForAccess_;
}

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