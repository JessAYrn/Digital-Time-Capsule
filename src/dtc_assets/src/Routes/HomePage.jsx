import React, { createContext, useReducer, useEffect, useState} from 'react';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import LoginPage from './Pages/authentication/LoginPage';
import { UI_CONTEXTS } from '../functionsAndConstants/Contexts';
import Analytics from './Pages/Analytics';
import "./HomePage.scss";
import { loadAllDataIntoReduxStores, recoverState } from '../functionsAndConstants/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import { DEFAULT_APP_CONTEXTS } from '../functionsAndConstants/Constants';
import walletReducer,{walletTypes, walletInitialState} from '../reducers/walletReducer'
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import homePageReducer,{homePageInitialState,homePageTypes} from '../reducers/homePageReducer';
import actorReducer, { actorInitialState, actorTypes } from '../reducers/actorReducer';
import notificationsReducer, {notificationsInitialState, notificationsTypes} from "../reducers/notificationsReducer";
import modalReducer, { modalTypes, modalInitialState } from '../reducers/modalReducer';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const HomePage = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [modalState, modalDispatch] = useReducer(modalReducer, modalInitialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [homePageState, homePageDispatch] = useReducer(homePageReducer, homePageInitialState);
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);
    const [stateHasBeenRecovered, setStateHasBeenRecovered] = useState(false);

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route
    const location = useLocation();


    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        homePageDispatch,
        actorDispatch,
        notificationsDispatch,
        modalDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes,
        homePageTypes,
        actorTypes,
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

    // dispatch state from previous route to redux store if that state exists
    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult, setStateHasBeenRecovered );

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

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
                modalDispatch,
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