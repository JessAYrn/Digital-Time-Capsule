import React, { createContext, useReducer, useEffect} from 'react';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import Analytics from '../Components/Analytics';
import "./HomePage.scss";
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadCanisterData, loadJournalData, loadWalletData } from '../Components/loadingFunctions';

export const AppContext = createContext({
    journalState: null,
    dispatch: () => {}
});

const HomePage = () => {

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

    useEffect( async () => {
        if(!journalState.actor) return;
        if(journalState.reloadStatuses.canisterData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let canisterData = await journalState.actor.getCanisterData();
            if(!canisterData) return;
            if("err" in canisterData) canisterData = await CreateUserJournal(journalState, dispatch, 'getCanisterData');
            if("err" in canisterData) {
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            }
            canisterData = loadCanisterData(canisterData, dispatch, types);
            let requestsForApproval;
            if(canisterData.isOwner){
                requestsForApproval = await journalState.actor.getRequestingPrincipals();
                requestsForApproval = requestsForApproval.ok;
                let updatedCanisterData = {...canisterData, requestsForApproval};
                dispatch({
                    actionType: types.SET_CANISTER_DATA,
                    payload: updatedCanisterData
                });
            }
            dispatch({
                actionType: types.SET_CANISTER_DATA_RELOAD_STATUS,
                payload: false,
            });
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
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await journalState.actor.readWalletData();
            await loadWalletData(walletDataFromApi, dispatch, types);
        };


    }, [journalState.actor]);

    return (
        <AppContext.Provider 
            value={{
                journalState,
                dispatch
            }}
        >

            {           
                journalState.isAuthenticated ? 
                    <Analytics/> : 
                    <LoginPage
                        context={UI_CONTEXTS.HOME_PAGE}
                    /> 
            }
        </AppContext.Provider>
    );
};

export default HomePage;