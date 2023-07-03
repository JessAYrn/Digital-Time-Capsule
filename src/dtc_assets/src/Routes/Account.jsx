import React, {useReducer, createContext, useEffect, useState} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import AccountSection from '../Pages/AccountPage';
import { useLocation } from 'react-router-dom';
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import { recoverState, loadAllDataIntoReduxStores  } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import { DEFAULT_APP_CONTEXTS } from '../Constants';
import walletReducer,{ walletInitialState, walletTypes } from '../reducers/walletReducer';
import homePageReducer, { homePageInitialState, homePageTypes } from '../reducers/homePageReducer';
import actorReducer, { actorInitialState,actorTypes } from "../reducers/actorReducer";

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const AccountPage = () => {

    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [walletState, walletDispatch]=useReducer(walletReducer,walletInitialState);
    const [homePageState, homePageDispatch]=useReducer(homePageReducer,homePageInitialState);
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        homePageDispatch,
        actorDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes,
        homePageTypes,
        actorTypes
    }

    const ReducerStates = {
        journalState,
        walletState,
        accountState,
        homePageState,
        actorState
    };

    // gets state from previous route
    const location = useLocation();

    // dispatch state from previous route to redux store if that state exists
    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult );

    useEffect(async () => {
        if(!actorState.backendActor) return;
        accountDispatch( { actionType: accountTypes.SET_IS_LOADING, payload: true } );
        await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes);
        console.log('here');
        accountDispatch( { actionType: accountTypes.SET_IS_LOADING, payload: false } );
    },[actorState.backendActor]);

    return (
        <AppContext.Provider 
            value={{
                journalState,
                journalDispatch,
                accountDispatch,
                accountState,
                walletDispatch,
                walletState,
                homePageState,
                homePageDispatch,
                actorState,
                actorDispatch
            }}
        >
            {
                journalState.isAuthenticated ? 
                    <AccountSection/> : 
                    <LoginPage
                        context={UI_CONTEXTS.ACCOUNT_PAGE}
                    /> 
            }
        </AppContext.Provider>
    )

};

export default AccountPage;