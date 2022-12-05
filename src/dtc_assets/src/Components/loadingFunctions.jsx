import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";
import { delay, toHexString } from "../Utils";
import { generateQrCode } from "./walletFunctions/GenerateQrCode";
import { mapBackendCanisterDataToFrontEndObj } from "../mappers/dashboardMapperFunctions";

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
    const address = toHexString(new Uint8Array( [...walletDataFromApi.ok.address]))
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

export const loadTxHistory = async (journalState, dispatch, types) => {
    if(!journalState.actor){
        throw 'No actor defined'
    };

    const tx = await journalState.actor.readTransaction();
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
        let journal = await fnForLoadingData();
        return journal;
    } catch (e){
        console.error(e)
        await delay(5000);
        fnForRefiringAuthentication(journalState, dispatch, types);
        return null
    }
}