import React, {useReducer, createContext, useEffect, useState} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from './Pages/authentication/LoginPage';
import { UI_CONTEXTS } from '../functionsAndConstants/Contexts';
import { loadAllDataIntoReduxStores, recoverState  } from '../functionsAndConstants/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import TreasuryPage from './Pages/TreasuryPage'
import { DEFAULT_APP_CONTEXTS } from '../functionsAndConstants/Constants';
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import walletReducer,{ walletInitialState, walletTypes } from '../reducers/walletReducer';
import actorReducer, { actorInitialState, actorTypes } from '../reducers/actorReducer';
import homePageReducer,{ homePageInitialState, homePageTypes } from '../reducers/homePageReducer';
import notificationsReducer, {notificationsInitialState, notificationsTypes} from "../reducers/notificationsReducer";
import modalReducer,{ modalTypes, modalInitialState } from '../reducers/modalReducer';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const Treasury = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [modalState, modalDispatch] = useReducer(modalReducer, modalInitialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [walletState, walletDispatch]=useReducer(walletReducer,walletInitialState);
    const [actorState, actorDispatch]= useReducer(actorReducer, actorInitialState);
    const [homePageState, homePageDispatch]= useReducer(homePageReducer, homePageInitialState);
    const [stateHasBeenRecovered, setStateHasBeenRecovered] = useState(false);

    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
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
        accountState,
        accountDispatch,
        walletDispatch,
        walletState,
        homePageDispatch,
        homePageState,
        actorDispatch,
        actorState,
        notificationsState,
        notificationsDispatch,
        modalState,
        modalDispatch
    }}
    >
        {           
                journalState.isAuthenticated ? 
                <TreasuryPage/>    
                : 
                <LoginPage
                        context={UI_CONTEXTS.TREASURY}
                /> 
        }

    </AppContext.Provider>
  )
}

export default Treasury;