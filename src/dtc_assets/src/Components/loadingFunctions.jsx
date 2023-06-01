import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";
import { delay, managerActor, backendActor, toHexString } from "../Utils";
import { generateQrCode } from "./walletFunctions/GenerateQrCode";
import { mapBackendCanisterDataToFrontEndObj } from "../mappers/dashboardMapperFunctions";
import { getFileUrl_fromApi } from "./Fields/fileManger/FileManagementTools";



export const loadJournalData = (journal, dispatch, types) => {
    const journalEntriesObject = mapApiObjectToFrontEndJournalEntriesObject(journal);
    let journalEntries = journalEntriesObject.allEntries;
    let unreadEntries = journalEntriesObject.unreadEntries;
    dispatch({
        payload: unreadEntries,
        actionType: types.SET_JOURNAL_UNREAD_ENTRIES
    })
    let userJournalData = journal.ok.userJournalData || journal.ok
    const journalBio = userJournalData[1];
    const metaData = {email : journal.ok.email, userName: journal.ok.userName};
    
    dispatch({
        payload: metaData,
        actionType: types.SET_METADATA
    })
    dispatch({
        payload: journalBio,
        actionType: types.SET_BIO
    })
    dispatch({
        payload: journalEntries,
        actionType: types.SET_JOURNAL
    });
    dispatch({
        actionType: types.SET_JOURNAL_DATA_RELOAD_STATUS,
        payload: false,
    });
};

export const loadJournalDataResponseAfterSubmit = (journal, dispatch, types) => {
    const journalEntriesObject = mapApiObjectToFrontEndJournalEntriesObject(journal);
    let journalEntries = journalEntriesObject.allEntries;
    let unreadEntries = journalEntriesObject.unreadEntries;
    dispatch({
        payload: unreadEntries,
        actionType: types.SET_JOURNAL_UNREAD_ENTRIES
    })
    let userJournalData = journal.ok
    const journalBio = userJournalData[1];
    
    dispatch({
        payload: journalBio,
        actionType: types.SET_BIO
    })
    dispatch({
        payload: journalEntries,
        actionType: types.SET_JOURNAL
    });
    dispatch({
        actionType: types.SET_JOURNAL_DATA_RELOAD_STATUS,
        payload: false,
    });
};



export const loadWalletData = async (walletDataFromApi, dispatch, types ) => {

    const address = toHexString(new Uint8Array( [...walletDataFromApi.ok.address]));
    const walletData = { 
        balance : parseInt(walletDataFromApi.ok.balance.e8s), 
        address: address
    };

    const qrCodeImgUrl = await generateQrCode(address);
    dispatch({
        actionType: types.SET_WALLET_QR_CODE_IMG_URL,
        payload: qrCodeImgUrl
    });
    dispatch({
        payload: walletData,
        actionType: types.SET_WALLET_DATA
    });
    dispatch({
        actionType: types.SET_WALLET_DATA_RELOAD_STATUS,
        payload: false,
    });
};

export const loadTxHistory = async (actorState, dispatch, types) => {
    if(!actorState.backendActor){
        throw 'No actor defined'
    };

    const tx = await actorState.backendActor.readTransaction();
    const transactionHistory = tx.ok.sort(function(a,b){
        const mapKeyOfA = parseInt(a[0]);
        const mapKeyOfB = parseInt(b[0]);
        if (mapKeyOfA > mapKeyOfB){
            return -1
        } else {
            return 1
        }
    });
    dispatch({
        actionType: types.SET_TX_HISTORY_DATA,
        payload: transactionHistory
    });
    return {transactionHistory, tx};
};

export const loadNftData = (nftCollection, dispatch, types) => {
    nftCollection = nftCollection.ok;
    dispatch({
        payload: nftCollection,
        actionType: types.SET_NFT_DATA
    });
    dispatch({
        payload: false,
        actionType: types.SET_NFT_DATA_RELOAD_STATUS
    });
};

export const loadCanisterData = (canisterData, dispatch, types) => {
    canisterData = canisterData.ok;
    canisterData = mapBackendCanisterDataToFrontEndObj(canisterData);
    dispatch({
        actionType: types.SET_CANISTER_DATA,
        payload: canisterData
    });
    dispatch({
        actionType: types.SET_CANISTER_DATA_RELOAD_STATUS,
        payload: false,
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

export const recoverState = async (journalState, location, dispatch,types,connectionResult) => {
    // console.log('types :', types);
    // let{journalTypes,walletTypes}=types;
    // let{SET_ENTIRE_REDUX_STATE}= journalTypes;
    // console.log(SET_ENTIRE_REDUX_STATE);
    // console.log(journalTypes);
    // console.log(walletTypes);
    // console.log('types:', journalTypes.SET_ENTIRE_REDUX_STATE)

    // dispatch state from previous route to redux store if that state exists
    if(location.state){
        const{journal,wallet,homePage}=location.state;
        console.log(wallet)
        if(dispatch.journalDispatch){
            dispatch.journalDispatch({
                actionType: types.journalTypes.SET_ENTIRE_REDUX_STATE,
                payload: journal
            });
        }

        if(dispatch.walletDispatch){
            dispatch.walletDispatch({
                actionType: types.walletTypes.SET_ENTIRE_WALLET_REDUX_STATE,
                payload:wallet
            })
        }

        if(dispatch.homePageDispatch){
            dispatch.homePageDispatch({
                actionType: types.homePageTypes.SET_ENTIRE_DASHBOARD_REDUX_STATE,
                payload:homePage
            })
        }
        console.log(homePage)
        

        //wipe previous location state to prevent infinite loop
        location.state = null;
        const promises = [
            backendActor(connectionResult.activeProvider),
            managerActor(connectionResult.activeProvider)
        ];
        const [backendActor_, managerActor_] = await Promise.all(promises);
        dispatch.actorDispatch({
            actionType: types.actorTypes.SET_BACKEND_ACTOR,
            payload: backendActor_
        });
        dispatch.actorDispatch({
            actionType: types.actorTypes.SET_MANAGER_ACTOR,
            payload: managerActor_
        });
    };
};

export const fileLoaderHelper =  async (
    fileData, 
    fileIndex,
    pageIndex,
    actorState, 
    dispatch, 
    actionTypeToChangeFileLoadStatus,
    actionTypeToSetFile
    ) => {
    dispatch({
        actionType: actionTypeToChangeFileLoadStatus,
        payload: true,
        blockReload: true,
        fileIndex: fileIndex,
        index: pageIndex
    });
    const dataURL = await getFileUrl_fromApi(actorState, fileData);
    dispatch({
        actionType: actionTypeToSetFile,
        payload: dataURL,
        blockReload: true,
        fileIndex: fileIndex,
        index: pageIndex
    });
    dispatch({
        actionType: actionTypeToChangeFileLoadStatus,
        payload: false,
        blockReload: true,
        fileIndex: fileIndex,
        index: pageIndex
    });
    return dataURL;
}