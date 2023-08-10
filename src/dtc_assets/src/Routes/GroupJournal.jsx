import React, {useReducer, createContext, useEffect, useState} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from './Pages/authentication/LoginPage';
import { UI_CONTEXTS } from '../functionsAndConstants/Contexts';
import { recoverState, loadAllDataIntoReduxStores  } from '../functionsAndConstants/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import GroupJournalPage from './Pages/GroupJournalPage';
import { DEFAULT_APP_CONTEXTS } from '../functionsAndConstants/Constants';
import walletReducer, { walletInitialState,walletTypes } from '../reducers/walletReducer';
import homePageReducer, { homePageInitialState,homePageTypes } from '../reducers/homePageReducer';
import accountReducer, { accountInitialState,accountTypes } from '../reducers/accountReducer';
import actorReducer, { actorInitialState,actorTypes } from '../reducers/actorReducer';
import notificationsReducer, {notificationsInitialState, notificationsTypes} from "../reducers/notificationsReducer";
import modalReducer, { modalTypes, modalInitialState } from '../reducers/modalReducer';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const GroupJournal = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [modalState, modalDispatch] = useReducer(modalReducer, modalInitialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [homePageState, homePageDispatch] =  useReducer(homePageReducer, homePageInitialState)
    const [accountState, accountDispatch] =  useReducer(accountReducer, accountInitialState)
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);
    const [stateHasBeenRecovered, setStateHasBeenRecovered] = useState(false);

    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        actorDispatch,
        homePageDispatch,
        notificationsDispatch,
        modalDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes,
        actorTypes,
        homePageTypes,
        notificationsTypes,
        modalTypes
    }

    const ReducerStates = {
        journalState,
        walletState,
        accountState,
        homePageState,
        actorState,
        notificationsState,
        modalState
    };
    
    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
    //gets state from previous route
    const location = useLocation()

    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult, setStateHasBeenRecovered );


    
    
    useEffect( async () => {
        if(!actorState.backendActor) return;
        await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes, stateHasBeenRecovered);
    }, [actorState.backendActor]);
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
        notificationsState,
        notificationsDispatch,
        modalState,
        modalDispatch
    }}
    >
        {           
                journalState.isAuthenticated ? 
                <GroupJournalPage/> : 
                <LoginPage
                        context={UI_CONTEXTS.GROUPJOURNAL}
                /> 
        }

    </AppContext.Provider>
  )
}

export default GroupJournal;