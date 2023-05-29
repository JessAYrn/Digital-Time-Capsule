import * as React from 'react';
import { createContext, useState, useEffect, useReducer, useMemo} from 'react';
import { useLocation } from 'react-router-dom';
import Journal from '../Pages/Journal';
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import walletReducer, { walletTypes,walletInitialState } from '../reducers/walletReducer';
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import { TEST_DATA_FOR_NOTIFICATIONS } from '../testData/notificationsTestData';
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadCanisterData, loadJournalData, loadWalletData, recoverState} from '../Components/loadingFunctions';
import { useConnect } from "@connect2ic/react";
import Notes from '../Pages/Notes';
import { DEFAULT_APP_CONTEXTS, JOURNAL_TABS } from '../Constants';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const App = () => {
    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);

    const [submissionsMade, setSubmissionsMade] = useState(0);

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route
    const location = useLocation();

    const ReducerDispatch={
        journalDispatch:dispatch,
        walletDispatch
    }

    const ReducerType={
        journalTypes:types,       
        walletTypes
    }

    // dispatch state from previous route to redux store if that state exists
    recoverState(journalState, location, ReducerDispatch, ReducerType, connectionResult);
   
    // clears useLocation().state upon page refresh so that when the user refreshes the page,
    // changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    

    useEffect(async () => {
        if(!journalState.backendActor) return;
        if(journalState.reloadStatuses.journalData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let journal = await journalState.backendActor.readJournal();
            if(!journal) return;
            if("err" in journal) journal = await CreateUserJournal(journalState, dispatch, 'readJournal');
            if("err" in journal) {
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            };
            loadJournalData(journal, dispatch, types);
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        }
        if(journalState.reloadStatuses.canisterData){
            //Load canister data in background
            const canisterData = await journalState.backendActor.getCanisterData();
            loadCanisterData(canisterData, dispatch, types);
        }
        if(walletState.shouldReload){
            //Load wallet data in background
            const walletDataFromApi = await journalState.backendActor.readWalletData();
            await loadWalletData(walletDataFromApi, walletDispatch, walletTypes);
        };
    },[journalState.backendActor]);

    let TabComponent = useMemo(()=>{
        if(journalState.journalPageTab===JOURNAL_TABS.diaryTab){
            return Journal
        }else{
            return Notes
        }
    },[journalState.journalPageTab])//variable added to the redux
    
   
    return (
        <AppContext.Provider 
            value={{
                journalState,
                dispatch,
                walletState,
                walletDispatch,
                submissionsMade,
                setSubmissionsMade
            }}
        >
            {
                journalState.isAuthenticated ? 
                    <TabComponent/> : 
                    <LoginPage
                        context={UI_CONTEXTS.JOURNAL}
                    /> 
            }
        </AppContext.Provider>
    )
}

export default App;