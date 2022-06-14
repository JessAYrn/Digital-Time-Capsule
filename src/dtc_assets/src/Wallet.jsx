import React, { createContext, useReducer, useState, useEffect} from 'react';
import LoginPage from './Components/LoginPage';
import { useLocation } from 'react-router-dom';
import { toHexString } from './Utils';
import { generateQrCode } from './Components/walletFunctions/GenerateQrCode';
import LoadScreen from './Components/LoadScreen';
import { mapApiObjectToFrontEndJournalEntriesObject } from './mappers/journalPageMappers';
import LoadScreen from './Components/LoadScreen';
import journalReducer, {initialState, types} from './reducers/journalReducer';
import {AuthClient} from "@dfinity/auth-client";
import { canisterId, createActor } from '../../declarations/dtc/index';
import { UI_CONTEXTS } from './Contexts';
import WalletPage from './Components/WalletPage';
import { testTx } from './testData/Transactions';

export const AppContext = createContext({
    authClient: {}, 
    setAuthClient: null,
    loginAttempted: undefined,
    setLoginAttempted: null,
    journalState:{},
    dispatch: () => {},
    actor: undefined,
    setActor: null
});


const WalletApp = () => {

    const [actor, setActor] = useState(undefined);
    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [authClient, setAuthClient] = useState(undefined);
    const [isLoaded, setIsLoaded] = useState(true);
    const [loginAttempted, setLoginAttempted] = useState(false);

    //gets state from previous route
    const location = useLocation();
    console.log('location state: ',location.state);


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
    useEffect(() => {
        AuthClient.create().then(async (client) => {
            setAuthClient(client);
            await client.isAuthenticated().then((result) => {
                dispatch({
                    actionType: types.SET_IS_AUTHENTICATED,
                    payload: result
                });
            });
            setIsLoaded(true);
        });
    }, [isLoaded])

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(() => {
        if(!authClient) return;

        const identity = authClient.getIdentity();
        const actor = createActor(canisterId, {
            agentOptions: {
                identity
            }
        });
        setActor(actor);

    }, [authClient]);

    const loadTxHistory = async () => {
        if(!actor){
            return;
        };
        
        dispatch({
            actionType: types.SET_IS_TX_HISTORY_LOADING,
            payload: true
        });

        const tx = await actor.readTransaction();
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
        if(!actor){
            return;
        }

        if(journalState.reloadStatuses.walletData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            const walletDataFromApi = await actor.readWalletData();
            if("err" in walletDataFromApi){
                actor.create().then((result) => {
                    console.log('line 125: ',result);
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
                const journal = await actor.readJournal();
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
    },[actor, authClient]);

    return(
        <AppContext.Provider 
                value={{
                    authClient, 
                    setIsLoaded,
                    loginAttempted, 
                    setLoginAttempted, 
                    journalState,
                    dispatch,
                    actor
                }}
            >
                {
                    isLoaded &&
                        journalState.isAuthenticated ?
                        journalState.isLoading ?
                            <LoadScreen/> : 
                                <WalletPage/> : 
                                    <LoginPage
                                        context={UI_CONTEXTS.WALLET}
                                    /> 
                }
                {
                    !isLoaded && 
                        <h2> Load Screen </h2>
                }
            </AppContext.Provider>
    );

}

export default WalletApp;