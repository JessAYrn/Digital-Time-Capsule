export const mapBackendCanisterDataToFrontEndObj = (props) => {
    const {
        approvedUsers,
        backEndCyclesBurnRatePerDay,
        backEndPrincipal,
        frontEndPrincipal,
        lastRecordedBackEndCyclesBalance,
        nftOwner,
        nftId
    } = props;

    return {
        approvedUsers: approvedUsers,
        backEndCyclesBurnRatePerDay: parseInt(backEndCyclesBurnRatePerDay),
        backEndPrincipal: backEndPrincipal,
        frontEndPrincipal: frontEndPrincipal,
        lastRecordedBackEndCyclesBalance: parseInt(lastRecordedBackEndCyclesBalance),
        nftOwner: nftOwner,
        nftId: nftId
    }
}; 