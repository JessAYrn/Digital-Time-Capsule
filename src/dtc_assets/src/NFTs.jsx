import React, { createContext, useState, useReducer, useEffect} from 'react';
import LoginPage from './Components/authentication/LoginPage';
import journalReducer, { types, initialState } from './reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoadScreen from './Components/LoadScreen';
import NftPage from './Components/NftPage';
import { UI_CONTEXTS } from './Contexts';
import { AuthenticateClient, CreateActor } from './Components/authentication/AuthenticationMethods';
import { loadJournalData, loadNftData, loadWalletData } from './Components/loadingFunctions';


export const AppContext = createContext({
    journalState:{},
    dispatch: () => {}
});


const NFTapp = () => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    // login function used when Authenticating the client (aka user)
    useEffect(() => {
        const authenticate = async () => {
            await AuthenticateClient(journalState, dispatch, types)
        };
        authenticate();
    }, [journalState.loginAttempts]);

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(() => {
        const constructActor = async () => {
            await CreateActor(journalState, dispatch, types)
        };
        constructActor();
    }, [journalState.isAuthenticated]);

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
    };

    useEffect(async () => {
        if(!journalState.isAuthenticated || !journalState.actor){
            return
        };
        if(journalState.reloadStatuses.nftData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let nftCollection = await journalState.actor.getUserNFTsInfo();
            if("err" in nftCollection){
                journalState.actor.create().then((result) => {
                    dispatch({
                        actionType: types.SET_IS_LOADING,
                        payload: false
                    });
                });
            } else {
                loadNftData(nftCollection, dispatch, types);
            }
        }
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await journalState.actor.readWalletData();
            await loadWalletData(walletDataFromApi, dispatch, types);
        }
        if(journalState.reloadStatuses.journalData){
            //Load Journal Data in the background
            const journal = await journalState.actor.readJournal();
            loadJournalData(journal, dispatch, types);            
        }
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    },[journalState.actor]);



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
                        <NftPage/> : 
                        <LoginPage
                            context={UI_CONTEXTS.NFT}
                        /> 
            }
        </AppContext.Provider>

    );

};


export default NFTapp;