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
import homePageReducer,{ homePageInitialState, homePageTypes } from '../reducers/homePageReducer';
import accountReducer,{ accountInitialState, accountTypes } from '../reducers/accountReducer';
import actorReducer, { actorInitialState, actorTypes } from '../reducers/actorReducer';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const App = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [homePageState, homePageDispatch] =  useReducer(homePageReducer, homePageInitialState)
    const [accountState, accountDispatch] =  useReducer(accountReducer, accountInitialState)
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);

    const [submissionsMade, setSubmissionsMade] = useState(0);

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route
    const location = useLocation();

    const ReducerDispatch={
        journalDispatch,
        walletDispatch,
        homePageDispatch,
        accountDispatch,
        actorDispatch
    }

    const ReducerType={
        journalTypes:types,       
        walletTypes,
        homePageTypes,
        accountTypes,
        actorTypes
    }

    // dispatch state from previous route to redux store if that state exists
    recoverState(journalState, location, ReducerDispatch, ReducerType, connectionResult);
   
    // clears useLocation().state upon page refresh so that when the user refreshes the page,
    // changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    

    useEffect(async () => {
        if(!actorState.backendActor) return;
        if(journalState.reloadStatuses.journalData){
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let journal = await actorState.backendActor.readJournal();
            if(!journal) return;
            if("err" in journal) journal = await CreateUserJournal(actorState, journalDispatch,'readJournal');
            if("err" in journal) {
                journalDispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            };
            loadJournalData(journal.ok, journalDispatch, types);
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        }
        if(journalState.reloadStatuses.canisterData){
            //Load canister data in background
            const canisterData = await actorState.backendActor.getCanisterData();
            loadCanisterData(canisterData, homePageDispatch, homePageTypes);
        }
        if(walletState.shouldReload){
            //Load wallet data in background
            const walletDataFromApi = await actorState.backendActor.readWalletData();
            await loadWalletData(walletDataFromApi, walletDispatch, walletTypes);
        };
    },[actorState.backendActor]);

    let TabComponent = useMemo(()=>{
        if(journalState.journalPageTab===JOURNAL_TABS.diaryTab) return Journal;
        else return Notes;
    },[journalState.journalPageTab])

    return (
        <AppContext.Provider 
            value={{
                journalState,
                journalDispatch,
                walletState,
                walletDispatch,
                accountDispatch,
                accountState,
                homePageDispatch,
                homePageState,
                actorReducer,
                actorState,
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