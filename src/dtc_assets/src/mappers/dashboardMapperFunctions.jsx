export const mapBackendCanisterDataToFrontEndObj = (props) => {
    const {
        users,
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
        journalCount
    } = props;

    return {
        users: users,
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
        journalCount: parseInt(journalCount)
    }
}; 