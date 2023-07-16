export const requestsForAccessTableColumns = [
    { field: 'id', headerName: '#', width: 90 },
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
    }
];

export const mapRequestsForAccessToTableRows = (requestsForAccess) => {
    const requestsForAccess_ = requestsForAccess.map(({userPrincipal, approvalStatus}, index) => {
        return {
            id: index,
            userPrincipal: userPrincipal,
            userName: "null"
        }
    });
    return requestsForAccess_;
}


export const mapBackendCanisterDataToFrontEndObj = (props) => {
    const {
        profilesMetaData,
        backEndCyclesBurnRatePerDay,
        backEndPrincipal,
        frontEndPrincipal,
        lastRecordedBackEndCyclesBalance,
        nftOwner,
        nftId,
        isOwner,
        supportMode,
        currentCyclesBalance_backend,
        currentCyclesBalance_frontend,
        acceptingRequests,
        journalCount,
        cyclesSaveMode,
        requestsForAccess
    } = props;

    const requestsForAccess_ = requestsForAccess.map(([userPrincipal, approvalStatus]) => {
        return {userPrincipal, approvalStatus};
    });

    return {
        profilesMetaData: profilesMetaData,
        backEndCyclesBurnRatePerDay: parseInt(backEndCyclesBurnRatePerDay),
        backEndPrincipal: backEndPrincipal,
        frontEndPrincipal: frontEndPrincipal,
        lastRecordedBackEndCyclesBalance: parseInt(lastRecordedBackEndCyclesBalance),
        currentCyclesBalance_backend: parseInt(currentCyclesBalance_backend),
        currentCyclesBalance_frontend: parseInt(currentCyclesBalance_frontend),
        nftOwner: nftOwner,
        isOwner: isOwner,
        nftId: parseInt(nftId),
        supportMode: supportMode,
        acceptingRequests: acceptingRequests,
        journalCount: parseInt(journalCount),
        cyclesSaveMode: cyclesSaveMode,
        requestsForAccess: requestsForAccess_
    }
}; 