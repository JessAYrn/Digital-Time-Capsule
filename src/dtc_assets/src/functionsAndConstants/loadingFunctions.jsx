import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";
import { toHexString, nanoSecondsToMiliSeconds, shortenHexString } from "./Utils";
import { generateQrCode } from "./walletFunctions/GenerateQrCode";
import { mapBackendCanisterDataToFrontEndObj } from "../mappers/dashboardMapperFunctions";
import { mapBalancesDataFromApiToFrontend, mapBackendTreasuryDataToFrontEndObj } from "../mappers/treasuryPageMapperFunctions";
import { getFileUrl_fromApi } from "../Components/Fields/fileManger/FileManagementTools";


export const loadAllDataIntoReduxStores = async (states, dispatchFunctions, types) => {
    let loadSuccessful = true;

    let {walletState, homePageState, journalState, actorState, notificationsState, treasuryState} = states;
    let {journalDispatch, walletDispatch, homePageDispatch, notificationsDispatch, treasuryDispatch} = dispatchFunctions;
    let {journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes } = types;
    //checks to see if user has an account. If not, then it attemptes to make an account, if 
    //the account creation is unsuccessful, then it returns
    let hasAccount = await actorState.backendActor.hasAccount();
    if(!hasAccount) { loadSuccessful = false; return loadSuccessful;}
    //calls the backend and loads the retrieved data into the appropriate redux stores.
    let promises = [
        loadWalletData(actorState, walletDispatch, walletTypes),
        loadCanisterData(actorState, homePageDispatch, homePageTypes),
        loadJournalData(actorState, journalDispatch, journalTypes),
        loadNotificationsData(actorState, notificationsDispatch, notificationsTypes),
        loadTreasuryData(actorState, treasuryDispatch, treasuryTypes)
    ];
    const response = await Promise.all(promises);
    return loadSuccessful
};

export const loadNotificationsData = async (actorState, notificationsDispatch, notificationsTypes) => {
    let notificationsData = await actorState.backendActor.getNotifications();
    notificationsDispatch({
        actionType: notificationsTypes.SET_NOTIFICATIONS,
        payload: notificationsData
    });
    notificationsDispatch({
        actionType: notificationsTypes.SET_DATA_HAS_BEEN_LOADED,
        payload: true
    });
};

export const loadJournalData = async (actorState, journalDispatch, types) => {
    let journal = await actorState.backendActor.readJournal();
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

export const loadWalletData = async (actorState, walletDispatch, types ) => {
    let promises = [ 
        actorState.backendActor.readWalletData(), 
        actorState.backendActor.retrieveUserBalances(), 
        loadTxHistory(actorState, walletDispatch, types) 
    ];
    const [walletDataFromApi, balancesHistory, _ ] = await Promise.all(promises);
    const userBalancesHistory = mapBalancesDataFromApiToFrontend(balancesHistory);
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
        payload: userBalancesHistory
    });
    walletDispatch({
        actionType: types.SET_DATA_HAS_BEEN_LOADED,
        payload: true,
    });
    return walletData;
};

export const loadTxHistory = async (actorState, walletDispatch, types) => {
    const tx = await actorState.backendActor.readTransaction();
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

export const loadCanisterData = async (actorState, dispatch, types) => {
    let canisterData = await actorState.backendActor.getCanisterData();
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

export const loadTreasuryData = async (actorState, dispatch, types) => {
    let promises = [actorState.backendActor.getTreasuryData(), actorState.backendActor.retrieveTreasuryBalances()];
    let [treasuryData, treasuryBalances] = await Promise.all(promises);
    treasuryBalances = mapBalancesDataFromApiToFrontend(treasuryBalances);
    treasuryData = treasuryData.ok;
    treasuryData = mapBackendTreasuryDataToFrontEndObj(treasuryData);
    dispatch({
        actionType: types.SET_TREASURY_DATA,
        payload: treasuryData
    });
    dispatch({
        actionType: types.SET_TREASURY_BALANCES_DATA,
        payload: treasuryBalances
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
        actorState, 
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
    const dataURL = await getFileUrl_fromApi(actorState, fileData);
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