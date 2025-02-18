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

const RenderDaoParticipants = () => {

    const { homePageState, homePageDispatch, navigationAndApiState } = useContext(AppContext);

    const [usersTableIsLoading, setUsersTableIsLoading] = useState(false);

    const [tableState, setTableState] = useState({});

    const subsidize = async () => {
        setUsersTableIsLoading(true);
        let principals = tableState?.rowSelection?.map(rowId => {
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

    const Unsubsidize = async () => {
        setUsersTableIsLoading(true);
        let principals = tableState?.rowSelection?.map(rowId => {
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
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection={"column"} padding={0} maxWidth={"700px"}>
            <DataTable
                onCellClick={(e) => { if(e === "yes" || e === "no") return; else copyText(e)}}
                transparent={true}
                checkboxSelection={true}
                disabled={!homePageState.canisterData.isAdmin}
                columns={usersTableColumns}
                rows={mapUsersProfileDataToTableRows(homePageState.canisterData.profilesMetaData)}
                onStateChange={(newState) => { if(!objectsAreEqual(tableState, newState)) setTableState(newState) }}
            />
            {
                !!tableState?.rowSelection?.length &&
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} position={"fixed"} bottom={0} maxWidth={"700px"}>
                        <ButtonField
                            gridSx={{margin: "2.5%", width: "40%", backgroundColor: CONTRAST_COLOR}}
                            color={BACKGROUND_COLOR}
                            onClick={subsidize}
                            Icon={CheckIcon}
                            text={"Subsidize"}
                            disabled={!homePageState.canisterData.isAdmin}
                            isLoading={usersTableIsLoading}
                            iconSize={"medium"}
                        />
                        <ButtonField
                            gridSx={{margin: "2.5%", width: "40%", backgroundColor: BACKGROUND_COLOR}}
                            color={CONTRAST_COLOR}
                            onClick={Unsubsidize}
                            Icon={ClearIcon}
                            text={"Unsubsidize"}
                            disabled={!homePageState.canisterData.isAdmin}
                            isLoading={usersTableIsLoading}
                            iconSize={"medium"}
                        />
                    </Grid>
            }
        </Grid>
    )
};

export default RenderDaoParticipants;


const mapUsersProfileDataToTableRows = (usersProfileData) => {
    const sortedUsersProfileData = usersProfileData.sort((a, b) => a?.userName?.localeCompare(b?.userName));
    console.log(sortedUsersProfileData);
    const profileMetaData = sortedUsersProfileData.map((metaData, index) => {
        return {
            id: index,
            ...metaData
        }
    });
    return profileMetaData;
};

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
