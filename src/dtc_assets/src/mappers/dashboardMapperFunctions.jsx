export const requestsForAccessTableColumns = [
    { 
        field: 'id', 
        headerName: '#', 
        width: 90 
    },
    {
      field: 'userPrincipal',
      headerName: 'User Principal',
      width: 150,
      editable: false,
    },
    {
        field: 'userName',
        headerName: 'User Name',
        width: 150,
        editable: false,
    },
    {
        field: 'approvalStatus',
        headerName: 'Approved',
        width: 90,
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
      headerName: 'User Principal',
      width: 150,
      editable: false,
    },
    {
        field: 'canisterId',
        headerName: 'Canisrer Principal',
        width: 150,
        editable: false,
    },
    {
        field: 'userName',
        headerName: 'User Name',
        width: 150,
        editable: false,
    },
    {
        field: 'approvalStatus',
        headerName: 'Subsidized',
        width: 90,
        type: 'boolean'
    }
];

export const mapRequestsForAccessToTableRows = (requestsForAccess) => {
    const requestsForAccess_ = requestsForAccess.map(([userPrincipal, approvalStatus], index) => {
        return {
            id: index,
            userPrincipal: userPrincipal,
            userName: "null",
            approvalStatus: approvalStatus
        }
    });
    return requestsForAccess_;
}

export const mapUsersProfileDataToTableRows = (usersProfileData) => {
    const profileMetaData = usersProfileData.map((metaData, index) => {
        return {
            id: index,
            userName: "null",
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
        currentCyclesBalance_backend,
        currentCyclesBalance_frontend,
        acceptingRequests,
        journalCount,
        cyclesSaveMode,
        requestsForAccess
    } = props;

    const requestsForAccess_ = mapRequestsForAccessToTableRows(requestsForAccess);
    const profilesMetaData_ = mapUsersProfileDataToTableRows(profilesMetaData);

    return {
        profilesMetaData: profilesMetaData_,
        backEndCyclesBurnRatePerDay: parseInt(backEndCyclesBurnRatePerDay),
        backEndPrincipal: backEndPrincipal,
        frontEndPrincipal: frontEndPrincipal,
        lastRecordedBackEndCyclesBalance: parseInt(lastRecordedBackEndCyclesBalance),
        currentCyclesBalance_backend: parseInt(currentCyclesBalance_backend),
        currentCyclesBalance_frontend: parseInt(currentCyclesBalance_frontend),
        isAdmin: isAdmin,
        proposals: proposals,
        supportMode: supportMode,
        acceptingRequests: acceptingRequests,
        journalCount: parseInt(journalCount),
        cyclesSaveMode: cyclesSaveMode,
        requestsForAccess: requestsForAccess_
    }
}; 