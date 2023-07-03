import React, { createContext, useReducer, useState, useEffect, useMemo, useState} from 'react';
import LoginPage from '../Components/authentication/LoginPage';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import walletReducer ,{walletInitialState, walletTypes} from '../reducers/walletReducer';
import { UI_CONTEXTS } from '../Contexts';
import WalletPage from '../Pages/WalletPage';
import { testTx } from '../testData/Transactions';
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadJournalData, loadWalletData, loadCanisterData, recoverState, loadAllDataIntoReduxStores } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import CkBtcPage from '../Pages/CkBtcPage';
import EthPage from '../Pages/EthPage';
import BtcPage from '../Pages/BtcPage';
import { DEFAULT_APP_CONTEXTS, WALLET_TABS } from '../Constants';
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import homePageReducer,{ homePageInitialState, homePageTypes } from '../reducers/homePageReducer';
import actorReducer , { actorInitialState, actorTypes } from '../reducers/actorReducer';



export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const WalletApp = () => {

    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [homePageState, homePageDispatch] = useReducer(homePageReducer, homePageInitialState);
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);

    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        homePageDispatch,
        actorDispatch
    }

    const ReducerTypes={
        journalTypes: types,
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

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route

    const location = useLocation();

    // dispatch state from previous route to redux store if that state exists
    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult );

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.

    window.onbeforeunload = window.history.replaceState(null, '');

    
    const WalletTabComponent = useMemo(() => {
        if(walletState.walletPageTab===WALLET_TABS.icpTab) return WalletPage;
        else if(walletState.walletPageTab===WALLET_TABS.btcTab) return BtcPage;
        else if(walletState.walletPageTab===WALLET_TABS.ethTab) return EthPage;
        else if(walletState.walletPageTab===WALLET_TABS.ckBtcTab) return CkBtcPage;
    },[walletState.walletPageTab]);


    //Loading Time Capsule Data
    useEffect(async () => {
        if(!actorState.backendActor) return; 
        walletDispatch( { actionType: walletTypes.SET_IS_LOADING, payload: true } );
        await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes);
        walletDispatch( { actionType: walletTypes.SET_IS_LOADING, payload: false } );
    },[actorState.backendActor]);

    console.log(walletState);

    return(
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
                    actorDispatch,
                    actorState
                }}
            >
                {
                    journalState.isAuthenticated ?
                        <WalletTabComponent/> : 
                        <LoginPage
                            context={UI_CONTEXTS.WALLET}
                        /> 
                }
            </AppContext.Provider>
    );

}

export default WalletApp;