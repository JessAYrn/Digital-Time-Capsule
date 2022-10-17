import React, { createContext, useReducer, useState, useEffect} from 'react';
import LoginPage from './Components/authentication/LoginPage';
import { useLocation } from 'react-router-dom';
import LoadScreen from './Components/LoadScreen';
import journalReducer, {initialState, types} from './reducers/journalReducer';
import { UI_CONTEXTS } from './Contexts';
import WalletPage from './Components/WalletPage';
import { testTx } from './testData/Transactions';
import { AuthenticateClient, CreateActor, CreateUserJournal, TriggerAuththenticateClientFunction } from './Components/authentication/AuthenticationMethods';
import { loadJournalData, loadWalletData, loadTxHistory, handleErrorOnFirstLoad } from './Components/loadingFunctions';

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

    const [seconds, setSeconds] = useState(0);
    let delayTimeInSeconds = 3;

    setTimeout(() => {if(seconds <= delayTimeInSeconds) setSeconds(seconds + 1)}, 1000);


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
            let walletDataFromApi = await handleErrorOnFirstLoad(
                journalState.actor.readWalletData, 
                TriggerAuththenticateClientFunction, 
                { journalState, dispatch, types }
            );
            if(!walletDataFromApi) return;
            if("err" in walletDataFromApi) walletDataFromApi = await CreateUserJournal(journalState, dispatch, 'readWalletData');
            if("err" in walletDataFromApi) {
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            };
            await loadWalletData(walletDataFromApi, dispatch, types);
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        }; 
        if(journalState.reloadStatuses.journalData){
            //Load Journal Data in the background
            const journal = await journalState.actor.readJournal();
            loadJournalData(journal, dispatch, types);
        };
        
    },[journalState.actor]);

    useEffect(async () => {
        if(seconds === delayTimeInSeconds){
            try{
                await loadTxHistory(journalState, dispatch, types);
            } catch {
                setSeconds(0);
            }
        };
    }, [seconds])

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