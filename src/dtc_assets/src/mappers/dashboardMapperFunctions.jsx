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
        currentCyclesBalance,
        acceptingRequests,
        journalCount
    } = props;

    return {
        users: users,
        backEndCyclesBurnRatePerDay: parseInt(backEndCyclesBurnRatePerDay),
        backEndPrincipal: backEndPrincipal,
        frontEndPrincipal: frontEndPrincipal,
        lastRecordedBackEndCyclesBalance: parseInt(lastRecordedBackEndCyclesBalance),
        currentCyclesBalance: parseInt(currentCyclesBalance),
        nftOwner: nftOwner,
        isOwner: isOwner,
        nftId: parseInt(nftId),
        supportMode: supportMode,
        acceptingRequests: acceptingRequests,
        journalCount: parseInt(journalCount)
    }
}; 