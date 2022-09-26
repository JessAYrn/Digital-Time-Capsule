import React, {useReducer, createContext, useState, useEffect} from 'react';
import journalReducer, { types, initialState } from './reducers/journalReducer';
import SubcriptionPage from './Components/AccountPage';
import { useLocation } from 'react-router-dom';
import LoadScreen from './Components/LoadScreen';
import LoginPage from './Components/authentication/LoginPage';
import { UI_CONTEXTS } from './Contexts';
import { AuthenticateClient, CreateActor, TriggerAuththenticateClientFunction } from './Components/authentication/AuthenticationMethods';
import { loadJournalData, loadNftData, loadWalletData, handleErrorOnFirstLoad } from './Components/loadingFunctions';

export const AppContext = createContext({
    journalState:{},
    dispatch: () => {}
});

const AccountPage = (props) => {

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
            let journal = await handleErrorOnFirstLoad(
                journalState.actor.readJournal, 
                TriggerAuththenticateClientFunction, 
                { journalState, dispatch, types }
            );
            if(!journal) return;
            if("err" in journal){
                journalState.actor.create().then((result) => {
                    dispatch({
                        actionType: types.SET_IS_LOADING,
                        payload: false
                    });
                });
            } else {
                loadJournalData(journal, dispatch, types);
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
            }
        }
        if(journalState.reloadStatuses.nftData){
            const nftCollection = await journalState.actor.getUserNFTsInfo();
            loadNftData(nftCollection, dispatch, types);
        }
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await journalState.actor.readWalletData();
            await loadWalletData(walletDataFromApi, dispatch, types);
        }
    },[journalState.actor]);

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