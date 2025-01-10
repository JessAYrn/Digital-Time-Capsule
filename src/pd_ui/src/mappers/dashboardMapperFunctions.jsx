import { sortProposals } from "../functionsAndConstants/governanceDataFunctions";

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
        daoIsPublic,
        costToEnterDao,
    } = props;

    return {
        profilesMetaData,
        userNames: mapUserPrincipalsToUserNames(profilesMetaData),
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
        requestsForAccess,
        releaseVersionLoaded: parseInt(releaseVersionLoaded),
        releaseVersionInstalled: parseInt(releaseVersionInstalled),
        founder,
        daoIsPublic,
        costToEnterDao: parseInt(costToEnterDao)
    }
}; 


const mapUserPrincipalsToUserNames = (profilesMetaData) => {
    let userNames = {};
    for(let {userPrincipal, userName} of profilesMetaData) { userNames[userPrincipal] = userName };
    return userNames;
};