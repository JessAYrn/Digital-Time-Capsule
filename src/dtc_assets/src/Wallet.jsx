import React, { createContext, useReducer, useState, useEffect} from 'react';
import LoginPage from './Components/authentication/LoginPage';
import { useLocation } from 'react-router-dom';
import { toHexString } from './Utils';
import { generateQrCode } from './Components/walletFunctions/GenerateQrCode';
import { mapApiObjectToFrontEndJournalEntriesObject } from './mappers/journalPageMappers';
import LoadScreen from './Components/LoadScreen';
import journalReducer, {initialState, types} from './reducers/journalReducer';
import { UI_CONTEXTS } from './Contexts';
import WalletPage from './Components/WalletPage';
import { testTx } from './testData/Transactions';
import { AuthenticateClient, CreateActor } from './Components/authentication/AuthenticationMethods';

export const AppContext = createContext({
    journalState:{},
    dispatch: () => {}
});


const WalletApp = () => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    //gets state from previous route
    const location = useLocation();

    //dispatch state from previous route to redux store if that state exists
    if(location.state){
        dispatch({
            actionType: types.SET_ENTIRE_REDUX_STATE,
            payload: location.state
        });
        //wipe previous location state to prevent infinite loop
        location.state = null;

    }

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    // login function used when Authenticating the client (aka user)
    useEffect(async () => await AuthenticateClient(dispatch, types), [journalState.isLoggingIn]);

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(async () => await CreateActor(journalState, dispatch, types), [journalState.authClient]);

    const loadTxHistory = async () => {
        if(!journalState.actor){
            return;
        };
        
        dispatch({
            actionType: types.SET_IS_TX_HISTORY_LOADING,
            payload: true
        });

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
        dispatch({
            actionType: types.SET_IS_TX_HISTORY_LOADING,
            payload: false
        });
    };

    //Loading Time Capsule Data
    useEffect(async () => {
        if(!journalState.actor){
            return;
        }

        if(journalState.reloadStatuses.walletData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            const walletDataFromApi = await journalState.actor.readWalletData();
            if("err" in walletDataFromApi){
                journalState.actor.create().then((result) => {
                });
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
            } else {
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
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                await loadTxHistory(journalState.walletData.address);

                //Load Journal Data in the background
                const journal = await journalState.actor.readJournal();
                const journalEntriesObject = mapApiObjectToFrontEndJournalEntriesObject(journal);
                let journalEntries = journalEntriesObject.allEntries;
                let unreadEntries = journalEntriesObject.unreadEntries;

                dispatch({
                    payload: unreadEntries,
                    actionType: types.SET_JOURNAL_UNREAD_ENTRIES
                })

                const journalBio = journal.ok.userJournalData[1];
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

            }
        } else {
            await loadTxHistory(journalState.walletData.address);
        }
    },[journalState.actor, journalState.authClient]);

    return(
        <AppContext.Provider 
                value={{
                    journalState,
                    dispatch
                }}
            >
                {
                    journalState.isAuthenticated ?
                    journalState.isLoading ?
                        <LoadScreen/> : 
                            <WalletPage/> : 
                                <LoginPage
                                    context={UI_CONTEXTS.WALLET}
                                /> 
                }
            </AppContext.Provider>
    );

}

export default WalletApp;