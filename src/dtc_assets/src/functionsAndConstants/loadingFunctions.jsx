import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";
import { delay, backendActor, toHexString, nanoSecondsToMiliSeconds } from "./Utils";
import { generateQrCode } from "./walletFunctions/GenerateQrCode";
import { mapBackendCanisterDataToFrontEndObj } from "../mappers/dashboardMapperFunctions";
import { mapBackendTreasuryDataToFrontEndObj } from "../mappers/treasuryPageMapperFunctions";
import { getFileUrl_fromApi } from "../Components/Fields/fileManger/FileManagementTools";
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import ButtonField from "../Components/Fields/Button";
import mapBalancesDataFromApiToFrontend from "../mappers/analyticsMappers";


export const loadAllDataIntoReduxStores = async (states, dispatchFunctions, types, stateHasBeenRecovered) => {
    //doesn't reload data if the data has already been recovered
    if(stateHasBeenRecovered) return; 

    let {walletState, homePageState, journalState, actorState, accountState, notificationsState, treasuryState} = states;
    let {journalDispatch, walletDispatch, homePageDispatch, accountDispatch, notificationsDispatch, treasuryDispatch} = dispatchFunctions;
    let {journalTypes, walletTypes, homePageTypes, accountTypes, notificationsTypes, treasuryTypes } = types;
    let accountCreationAttemptResults;
    //checks to see if user has an account. If not, then it attemptes to make an account, if 
    //the account creation is unsuccessful, then it returns
    let hasAccount = await actorState.backendActor.hasAccount();
    if(!hasAccount) accountCreationAttemptResults = await actorState.backendActor.create();
    if(accountCreationAttemptResults && "err" in accountCreationAttemptResults){
        return {
            openModal: true, 
            bigText: "Not Authorized To Enter", 
            Icon: DoNotDisturbOnIcon,
            displayConnectButton: true,
            smallText: "If you are the owner of this application, attempting to log in for the first time, you must log in using the wallet that owns the Utility NFT that corresponds to this server.",
            components: [{
                Component: ButtonField,
                props: {
                    active: true,
                    text: "Request Access",
                    onClick: () => {
                        actorState.backendActor.requestApproval();
                        alert("Your request for access has been sent.");
                    }
                }
            }]
        }
    }

    //calls the backend and loads the retrieved data into the appropriate redux stores.
    let promises = [];
    if(!walletState.dataHasBeenLoaded) promises.push(loadWalletData(actorState, walletDispatch, walletTypes));
    if(!homePageState.dataHasBeenLoaded) promises.push(loadCanisterData(actorState, homePageDispatch, homePageTypes));
    if(!journalState.dataHasBeenLoaded) promises.push(loadJournalData(actorState, journalDispatch, journalTypes));
    if(!accountState. dataHasBeenLoaded) promises.push(loadAccountData(actorState, accountDispatch, accountTypes));
    if(!notificationsState.dataHasBeenLoaded) promises.push(loadNotificationsData(actorState, notificationsDispatch, notificationsTypes));
    if(!treasuryState.dataHasBeenLoaded) promises.push(loadTreasuryData(actorState, treasuryDispatch, treasuryTypes));
    await Promise.all(promises);
    return {}
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
    let { userJournalData, principal } = journal;
    let [journalEntries, journalBio] = userJournalData;
    console.log(principal);
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
    treasuryBalances = mapBalancesDataFromApiToFrontend(treasuryBalances)
    treasuryData = treasuryData.ok;
    treasuryData = mapBackendTreasuryDataToFrontEndObj(treasuryData);
    console.log(treasuryData);
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
    const{journal,wallet,homePage, account, notifications, treasury}=location.state;
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

    if(dispatchMethods.treasuryDispatch){
        dispatchMethods.treasuryDispatch({
            actionType: types.treasuryTypes.SET_ENTIRE_TREASURY_REDUX_STATE,
            payload: treasury
        })
    }

    //wipe previous location state to prevent infinite loop
    location.state = null;
    const backendActor_ = await backendActor(connectionResult.activeProvider);
    dispatchMethods.actorDispatch({
        actionType: types.actorTypes.SET_BACKEND_ACTOR,
        payload: backendActor_
    })
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