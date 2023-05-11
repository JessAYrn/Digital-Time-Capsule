import React, { createContext, useState, useReducer, useEffect} from 'react';
import LoginPage from '../Components/authentication/LoginPage';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoadScreen from '../Components/LoadScreen';
import NftPage from '../Pages/NftPage';
import { UI_CONTEXTS } from '../Contexts';
import { AuthenticateClient, CreateActor, TriggerAuththenticateClientFunction, CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadJournalData, loadNftData, loadWalletData, handleErrorOnFirstLoad } from '../Components/loadingFunctions';


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
    }, [journalState.authenticateFunctionCallCount]);

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(() => {
        const constructActor = async () => {
            await CreateActor(journalState, dispatch, types)
        };
        constructActor();
    }, [journalState.createActorFunctionCallCount]);

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
        if(!journalState.isAuthenticated || !journalState.backendActor) return;
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        if(journalState.reloadStatuses.nftData){
            let nftCollection = await handleErrorOnFirstLoad(
                journalState.backendActor.getUserNFTsInfo, 
                TriggerAuththenticateClientFunction, 
                { journalState, dispatch, types }
            );
            if(!nftCollection) return;
            if("err" in nftCollection) nftCollection = await CreateUserJournal(journalState, dispatch, 'getUserNFTsInfo');
            if("err" in nftCollection) {
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            }
            loadNftData(nftCollection, dispatch, types);
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        };
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await journalState.backendActor.readWalletData();
            await loadWalletData(walletDataFromApi, dispatch, types);
        }
        if(journalState.reloadStatuses.journalData){
            //Load Journal Data in the background
            const journal = await journalState.backendActor.readJournal();
            loadJournalData(journal, dispatch, types);            
        };
    },[journalState.backendActor]);



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