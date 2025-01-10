import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";
import { toHexString, nanoSecondsToMiliSeconds } from "./Utils";
import { generateQrCode } from "./walletFunctions/GenerateQrCode";
import { mapBackendCanisterDataToFrontEndObj } from "../mappers/dashboardMapperFunctions";
import { mapBalancesData, mapBackendTreasuryDataToFrontEndObj } from "../mappers/treasuryPageMapperFunctions";
import { getFileUrl_fromApi } from "../components/fileManger/FileManagementTools";

export const loadAllDataIntoReduxStores = async (navigationAndApiState, dispatchFunctions, types) => {
    let loadSuccessful = true;
    let {journalDispatch, walletDispatch, homePageDispatch, notificationsDispatch, treasuryDispatch} = dispatchFunctions;
    let {journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes } = types;
    //checks to see if user has an account. If not, then it attemptes to make an account, if 
    //the account creation is unsuccessful, then it returns
    loadSuccessful = await navigationAndApiState.backendActor.hasAccount();
    if(!loadSuccessful) return {loadSuccessful};
    //calls the backend and loads the retrieved data into the appropriate redux stores.
    let promises = [
        loadWalletData(navigationAndApiState, walletDispatch, walletTypes),
        loadCanisterData(navigationAndApiState, homePageDispatch, homePageTypes),
        loadJournalData(navigationAndApiState, journalDispatch, journalTypes),
        loadNotificationsData(navigationAndApiState, notificationsDispatch, notificationsTypes),
        loadTreasuryData(navigationAndApiState, treasuryDispatch, treasuryTypes)
    ];
    await Promise.all(promises);
    return {loadSuccessful}
};

export const loadNotificationsData = async (navigationAndApiState, notificationsDispatch, notificationsTypes) => {
    let notificationsData = await navigationAndApiState.backendActor.getNotifications();
    notificationsDispatch({
        actionType: notificationsTypes.SET_NOTIFICATIONS,
        payload: notificationsData
    });
    notificationsDispatch({
        actionType: notificationsTypes.SET_DATA_HAS_BEEN_LOADED,
        payload: true
    });
};

export const loadJournalData = async (navigationAndApiState, journalDispatch, types) => {
    let journal = await navigationAndApiState.backendActor.readJournal();
    journal = journal.ok;
    let { userJournalData, userPrincipal, cyclesBalance, rootCanisterPrincipal } = journal;
    let [journalEntries, journalBio] = userJournalData;
    const filesMetaData = journalBio.photos.map(fileData => {
        return { ...fileData, lastModified : parseInt(fileData.lastModified), isLoading: true };
    });
    journalBio = {
        ...journalBio, 
        dob: journalBio.dob[0] ? [nanoSecondsToMiliSeconds(parseInt(journalBio.dob[0]))] : [],
        photos: filesMetaData
    };
    journalEntries = mapApiObjectToFrontEndJournalEntriesObject(journalEntries);
    journalDispatch({
        payload: journalBio,
        actionType: types.SET_BIO
    })
    journalDispatch({
        payload: {
            userPrincipal,
            cyclesBalance: parseInt(cyclesBalance),
            rootCanisterPrincipal
        
        },
        actionType: types.SET_USER_META_DATA
    });
    journalDispatch({
        payload: journalEntries,
        actionType: types.SET_JOURNAL
    });
    journalDispatch({
        actionType: types.SET_DATA_HAS_BEEN_LOADED,
        payload: true,
    });
};

export const loadWalletData = async (navigationAndApiState, walletDispatch, types ) => {
    let promises = [ 
        navigationAndApiState.backendActor.readWalletData(), 
        navigationAndApiState.backendActor.retrieveUserBalances(), 
        loadTxHistory(navigationAndApiState, walletDispatch, types) 
    ];
    const [walletDataFromApi, balancesHistory, _ ] = await Promise.all(promises);
    const address = toHexString(new Uint8Array( [...walletDataFromApi.ok.address]));
    const walletData = { 
        balance : parseInt(walletDataFromApi.ok.balance.e8s), 
        address: address
    };

    const qrCodeImgUrl = await generateQrCode(address);
    walletDispatch({
        actionType: types.SET_WALLET_QR_CODE_IMG_URL,
        payload: qrCodeImgUrl
    });
    walletDispatch({
        payload: walletData,
        actionType: types.SET_WALLET_DATA
    });
    walletDispatch({
        actionType: types.SET_WALLET_BALANCES_DATA,
        payload:  mapBalancesData(balancesHistory)
    });
    walletDispatch({
        actionType: types.SET_DATA_HAS_BEEN_LOADED,
        payload: true,
    });
    return walletData;
};

export const loadTxHistory = async (navigationAndApiState, walletDispatch, types) => {
    const tx = await navigationAndApiState.backendActor.readTransaction();
    let transactionHistory = tx.ok.map(([mapKey, tx_]) => {
        const newKey = parseInt(mapKey);
        const newTx = {
            ...tx_,
            recipient: toHexString(new Uint8Array( [...tx_.recipient])),
            source: toHexString(new Uint8Array( [...tx_.source])),
            balanceDelta: parseInt(tx_.balanceDelta),
            timeStamp: parseInt(tx_.timeStamp)
        };
        return [newKey, newTx]
    });
    transactionHistory = transactionHistory.sort(function(a,b){
        const mapKeyOfA = a[0];
        const mapKeyOfB = b[0];
        if (mapKeyOfA > mapKeyOfB) return -1; 
        else return 1;
    });
    walletDispatch({
        actionType: types.SET_TX_HISTORY_DATA,
        payload: transactionHistory
    });
};

export const loadCanisterData = async (navigationAndApiState, dispatch, types) => {
    let canisterData = await navigationAndApiState.backendActor.getCanisterData();
    canisterData = canisterData.ok;
    canisterData = mapBackendCanisterDataToFrontEndObj(canisterData);
    dispatch({
        actionType: types.SET_CANISTER_DATA,
        payload: canisterData
    });
    dispatch({
        actionType: types.SET_DATA_HAS_BEEN_LOADED,
        payload: true,
    });
    return canisterData;
}

export const loadTreasuryData = async (navigationAndApiState, dispatch, types) => {
    let promises = [navigationAndApiState.backendActor.getTreasuryData(), navigationAndApiState.backendActor.retrieveTreasuryBalances()];
    let [treasuryData, treasuryBalances] = await Promise.all(promises);
    dispatch({
        actionType: types.SET_TREASURY_DATA,
        payload: mapBackendTreasuryDataToFrontEndObj(treasuryData.ok)
    });
    dispatch({
        actionType: types.SET_TREASURY_BALANCES_DATA,
        payload: mapBalancesData(treasuryBalances)
    });
    dispatch({
        actionType: types.SET_DATA_HAS_BEEN_LOADED,
        payload: true,
    });
    return treasuryData;
};

export const fileLoaderHelper = async (props) => {
    const {
        fileData, 
        fileIndex,
        index,
        navigationAndApiState, 
        dispatch, 
        dispatchActionToChangeFileLoadStatus,
        dispatchActionToChangeFileMetaData
    } = props;
    dispatch({
        actionType: dispatchActionToChangeFileLoadStatus,
        payload: true,
        fileIndex: fileIndex,
        index: index
    });
    const dataURL = await getFileUrl_fromApi(navigationAndApiState, fileData);
    dispatch({
        actionType: dispatchActionToChangeFileMetaData,
        payload: { ...fileData, file: dataURL },
        fileIndex: fileIndex,
        index: index
    });
    dispatch({
        actionType: dispatchActionToChangeFileLoadStatus,
        payload: false,
        fileIndex: fileIndex,
        index: index
    });
    return dataURL;
}

export const allStatesLoaded = (reduxStates) => {
    for (const state in reduxStates) {
        if(!reduxStates[state].dataHasBeenLoaded) return false;
    }
    return true;
}