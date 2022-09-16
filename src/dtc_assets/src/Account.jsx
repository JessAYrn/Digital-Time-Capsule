import React, {useReducer, createContext, useState, useEffect} from 'react';
import journalReducer, { types, initialState } from './reducers/journalReducer';
import SubcriptionPage from './Components/AccountPage';
import { useLocation } from 'react-router-dom';
import { mapApiObjectToFrontEndJournalEntriesObject } from './mappers/journalPageMappers';
import { generateQrCode } from './Components/walletFunctions/GenerateQrCode';
import { toHexString } from './Utils';
import LoadScreen from './Components/LoadScreen';
import LoginPage from './Components/authentication/LoginPage';
import { UI_CONTEXTS } from './Contexts';
import { AuthenticateClient, CreateActor } from './Components/authentication/AuthenticationMethods';

export const AppContext = createContext({
    journalState:{},
    dispatch: () => {}
});

const AccountPage = (props) => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    // login function used when Authenticating the client (aka user)
    useEffect(async () => await (AuthenticateClient(dispatch, types)), [journalState.isLoggingIn]);

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(async () => await CreateActor(journalState, dispatch, types), [journalState.authClient]);

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

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

    useEffect(async () => {
        if(!journalState.isAuthenticated || !journalState.actor){
            return
        };
        if(journalState.reloadStatuses.journalData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            const journal = await journalState.actor.readJournal();
            if("err" in journal){
                journalState.actor.create().then((result) => {
                    dispatch({
                        actionType: types.SET_IS_LOADING,
                        payload: false
                    });
                });
            } else {
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
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
            }
        }
        if(journalState.reloadStatuses.nftData){
            const nftCollection = await journalState.actor.getUserNFTsInfo();
            dispatch({
                payload: nftCollection,
                actionType: types.SET_NFT_DATA
            });
            dispatch({
                payload: false,
                actionType: types.SET_NFT_DATA_RELOAD_STATUS
            });
            
        }
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await journalState.actor.readWalletData();
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
        }
    },[journalState.actor, journalState.authClient]);

    return (
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
                        <SubcriptionPage/> : 
                            <LoginPage
                                context={UI_CONTEXTS.ACCOUNT_PAGE}
                            /> 
            }
        </AppContext.Provider>
    )

};

export default AccountPage;