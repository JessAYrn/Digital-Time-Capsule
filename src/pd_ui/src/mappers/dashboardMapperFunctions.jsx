import { sortProposals } from "../functionsAndConstants/governanceDataFunctions";
export const requestsForAccessTableColumns = [
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

export const usersTableColumns = [
    { 
        field: 'id', 
        headerName: '#', 
        width: 90 
    },
    {
      field: 'userPrincipal',
      headerName: 'User Identity',
      width: 200,
      editable: false,
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

export const mapRequestsForAccessToTableRows = (requestsForAccess) => {
    const requestsForAccess_ = requestsForAccess.map(([userPrincipal, approvalStatus], index) => {
        return {
            id: index,
            userPrincipal: userPrincipal,
            approvalStatus: approvalStatus
        }
    });
    return requestsForAccess_;
}

export const mapUsersProfileDataToTableRows = (usersProfileData) => {
    const profileMetaData = usersProfileData.map((metaData, index) => {
        return {
            id: index,
            ...metaData
        }
    });
    return profileMetaData;
};


export const mapBackendCanisterDataToFrontEndObj = (props) => {
    const {
        profilesMetaData,
        backEndCyclesBurnRatePerDay,
        backEndPrincipal,
        frontEndPrincipal,
        lastRecordedBackEndCyclesBalance,
        isAdmin,
        proposals,
        supportMode,
        acceptingRequests,
        journalCount,
        requestsForAccess,
        treasuryCanisterPrincipal,
        releaseVersionLoaded,
        releaseVersionInstalled,
        founder,
        managerCanisterPrincipal,
    } = props;

    const requestsForAccess_ = mapRequestsForAccessToTableRows(requestsForAccess);
    const profilesMetaData_ = mapUsersProfileDataToTableRows(profilesMetaData);

    return {
        profilesMetaData: profilesMetaData_,
        backEndCyclesBurnRatePerDay: parseInt(backEndCyclesBurnRatePerDay),
        backEndPrincipal: backEndPrincipal,
        frontEndPrincipal: frontEndPrincipal,
        treasuryCanisterPrincipal: treasuryCanisterPrincipal,
        managerCanisterPrincipal: managerCanisterPrincipal,
        lastRecordedBackEndCyclesBalance: parseInt(lastRecordedBackEndCyclesBalance),
        isAdmin: isAdmin,
        proposals: sortProposals(proposals),
        supportMode: supportMode,
        acceptingRequests: acceptingRequests,
        journalCount: parseInt(journalCount),
        requestsForAccess: requestsForAccess_,
        releaseVersionLoaded: parseInt(releaseVersionLoaded),
        releaseVersionInstalled: parseInt(releaseVersionInstalled),
        founder
    }
}; 