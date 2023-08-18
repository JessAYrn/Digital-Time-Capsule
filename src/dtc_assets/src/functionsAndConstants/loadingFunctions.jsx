import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";
import { delay, managerActor, backendActor, toHexString, nanoSecondsToMiliSeconds } from "./Utils";
import { generateQrCode } from "./walletFunctions/GenerateQrCode";
import { mapBackendCanisterDataToFrontEndObj } from "../mappers/dashboardMapperFunctions";
import { getFileUrl_fromApi } from "../Components/Fields/fileManger/FileManagementTools";
import { CreateUserJournal } from "../Routes/Pages/authentication/AuthenticationMethods";
import { MODALS_TYPES } from "./Constants";


export const loadAllDataIntoReduxStores = async (states, dispatchFunctions, types, stateHasBeenRecovered) => {
    //doesn't reload data if the data has already been recovered
    if(stateHasBeenRecovered) return; 

    let {walletState, homePageState, journalState, actorState, accountState, notificationsState} = states;
    let {journalDispatch, walletDispatch, homePageDispatch, accountDispatch, notificationsDispatch, modalDispatch} = dispatchFunctions;
    let {journalTypes, walletTypes, homePageTypes, accountTypes, notificationsTypes, modalTypes } = types;

    // sets isLoading property to true for all reducers
    modalDispatch({ actionType: modalTypes.SET_IS_LOADING, payload: true });

    let accountCreated;
    //checks to see if user has an account. If not, then it attemptes to make an account, if 
    //the account creation is unsuccessful, then it returns
    let hasAccount = await actorState.backendActor.hasAccount();
    if(!hasAccount) accountCreated = await CreateUserJournal(actorState, journalDispatch);
    if(accountCreated && "err" in accountCreated){
        modalDispatch({ actionType: modalTypes.SET_MODAL_STATUS, payload: {which: MODALS_TYPES.notAuthorizedByOwner, show: true} })
        modalDispatch({ actionType: modalTypes.SET_IS_LOADING, payload: false })
        return;
    }

    //calls the backend and loads the retrieved data into the appropriate redux stores.
    let promises = [];
    if(!walletState.dataHasBeenLoaded) promises.push(loadWalletData(actorState, walletDispatch, walletTypes));
    if(!homePageState.dataHasBeenLoaded) promises.push(loadCanisterData(actorState, homePageDispatch, homePageTypes));
    if(!journalState.dataHasBeenLoaded) promises.push(loadJournalData(actorState, journalDispatch, journalTypes));
    if(!accountState. dataHasBeenLoaded) promises.push(loadAccountData(actorState, accountDispatch, accountTypes));
    if(!notificationsState.dataHasBeenLoaded) promises.push(loadNotificationsData(actorState, notificationsDispatch, notificationsTypes));
    await Promise.all(promises);

    // sets isLoading property to false for all reducers
    modalDispatch({ actionType: modalTypes.SET_IS_LOADING, payload: false });
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

export const loadAccountData = async (actorState, accountDispatch, accountTypes) => {
    let accountData = await actorState.backendActor.readJournal();
    accountData = accountData.ok;
    let {email, userName} = accountData;
    let metaData = {};
    if(email) metaData.email = email;
    if(userName) metaData.userName = userName;
    if(Object.keys(metaData).length) {
        accountDispatch({
            payload: metaData,
            actionType: accountTypes.SET_METADATA
        });
    };
    accountDispatch({
        actionType: accountTypes.SET_DATA_HAS_BEEN_LOADED,
        payload: true,
    });
};

export const loadJournalData = async (actorState, journalDispatch, types) => {
    let journal = await actorState.backendActor.readJournal();
    journal = journal.ok;
    let { userJournalData } = journal;
    let [journalEntries, journalBio] = userJournalData;
    journalBio = {...journalBio, dob: nanoSecondsToMiliSeconds(parseInt(journalBio.dob))}
    journalEntries = mapApiObjectToFrontEndJournalEntriesObject(journalEntries);
    journalDispatch({
        payload: journalBio,
        actionType: types.SET_BIO
    })
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

    let walletDataFromApi = await actorState.backendActor.readWalletData();

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
        actionType: types.SET_DATA_HAS_BEEN_LOADED,
        payload: true,
    });
};

export const loadTxHistory = async (actorState, walletDispatch, types) => {
    if(!actorState.backendActor) throw 'No actor defined';
    const tx = await actorState.backendActor.readTransaction();
    const transactionHistory = tx.ok.sort(function(a,b){
        const mapKeyOfA = parseInt(a[0]);
        const mapKeyOfB = parseInt(b[0]);
        if (mapKeyOfA > mapKeyOfB) return -1; 
        else return 1;
    });
    walletDispatch({
        actionType: types.SET_TX_HISTORY_DATA,
        payload: transactionHistory
    });
    return {transactionHistory, tx};
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

export const handleErrorOnFirstLoad = async (fnForLoadingData, fnForRefiringAuthentication, props_ ) => {
    const {
        journalState, 
        dispatch, 
        types
    } = props_;
    try{
        let data = await fnForLoadingData();
        return data;
    } catch (e){
        console.error(e)
        await delay(5000);
        fnForRefiringAuthentication(journalState, dispatch, types);
        return null
    }
}

export const recoverState = async ( location, dispatchMethods, types, connectionResult, setStateHasBeenRecovered ) => {

    // dispatch state from previous route to redux store if that state exists
    if(!location.state) return;
    setStateHasBeenRecovered(true);
    const{journal,wallet,homePage, account, notifications, modal}=location.state;
    if(dispatchMethods.journalDispatch){
        dispatchMethods.journalDispatch({
            actionType: types.journalTypes.SET_ENTIRE_REDUX_STATE,
            payload: journal
        });
    }

    if(dispatchMethods.walletDispatch){
        dispatchMethods.walletDispatch({
            actionType: types.walletTypes.SET_ENTIRE_WALLET_REDUX_STATE,
            payload: wallet
        })
    }

    if(dispatchMethods.homePageDispatch){
        dispatchMethods.homePageDispatch({
            actionType: types.homePageTypes.SET_ENTIRE_DASHBOARD_REDUX_STATE,
            payload: homePage
        })
    }

    if(dispatchMethods.accountDispatch){
        dispatchMethods.accountDispatch({
            actionType: types.accountTypes.SET_ENTIRE_ACCOUNT_REDUX_STATE,
            payload: account
        })
    }

    if(dispatchMethods.notificationsDispatch){
        dispatchMethods.notificationsDispatch({
            actionType: types.notificationsTypes.SET_ENTIRE_NOTIFICATIONS_REDUX_STATE,
            payload: notifications
        })
    }

    if(dispatchMethods.modalDispatch){
        dispatchMethods.modalDispatch({
            actionType: types.modalTypes.SET_ENTIRE_MODAL_REDUX_STATE,
            payload: modal
        })
    }

    //wipe previous location state to prevent infinite loop
    location.state = null;
    const promises = [
        backendActor(connectionResult.activeProvider),
        managerActor(connectionResult.activeProvider)
    ];
    const [backendActor_, managerActor_] = await Promise.all(promises);
    dispatchMethods.actorDispatch({
        actionType: types.actorTypes.SET_BACKEND_ACTOR,
        payload: backendActor_
    });
    dispatchMethods.actorDispatch({
        actionType: types.actorTypes.SET_MANAGER_ACTOR,
        payload: managerActor_
    });
};

export const fileLoaderHelper =  async (props) => {
    const {
        fileData, 
        fileIndex,
        index,
        actorState, 
        journalDispatch, 
        dispatchActionToChangeFileLoadStatus,
        dispatchActionToChangeFileMetaData
    } = props
    journalDispatch({
        actionType: dispatchActionToChangeFileLoadStatus,
        payload: true,
        blockReload: true,
        fileIndex: fileIndex,
        index: index
    });
    const dataURL = await getFileUrl_fromApi(actorState, fileData);
    journalDispatch({
        actionType: dispatchActionToChangeFileMetaData,
        payload: { ...fileData, file: dataURL},
        blockReload: true,
        fileIndex: fileIndex,
        index: index
    });
    journalDispatch({
        actionType: dispatchActionToChangeFileLoadStatus,
        payload: false,
        blockReload: true,
        fileIndex: fileIndex,
        index: index
    });
    return dataURL;
}