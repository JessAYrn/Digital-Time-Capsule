import React, {useReducer, createContext, useEffect, useState} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import { recoverState, loadAllDataIntoReduxStores  } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import GroupJournalPage from '../Pages/GroupJournalPage';
import { DEFAULT_APP_CONTEXTS } from '../Constants';
import walletReducer, { walletInitialState,walletTypes } from '../reducers/walletReducer';
import homePageReducer, { homePageInitialState,homePageTypes } from '../reducers/homePageReducer';
import accountReducer, { accountInitialState,accountTypes } from '../reducers/accountReducer';
import actorReducer, { actorInitialState,actorTypes } from '../reducers/actorReducer';





export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const GroupJournal = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [homePageState, homePageDispatch] =  useReducer(homePageReducer, homePageInitialState)
    const [accountState, accountDispatch] =  useReducer(accountReducer, accountInitialState)
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);

    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        actorDispatch,
        homePageDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes,
        actorTypes,
        homePageTypes
    }

    const ReducerStates = {
        journalState,
        walletState,
        accountState,
        homePageState,
        actorState
    };
    
    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
    //gets state from previous route
    const location = useLocation()

    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult );


    
    
    useEffect( async () => {
        if(!actorState.backendActor) return;
        homePageDispatch( { actionType: homePageTypes.SET_IS_LOADING, payload: true } );
        await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes);
        homePageDispatch( { actionType: homePageTypes.SET_IS_LOADING, payload: false } );
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