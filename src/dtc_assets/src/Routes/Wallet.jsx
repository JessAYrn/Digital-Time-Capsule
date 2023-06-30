import React, { createContext, useReducer, useState, useEffect, useMemo} from 'react';
import LoginPage from '../Components/authentication/LoginPage';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import walletReducer ,{walletInitialState, walletTypes} from '../reducers/walletReducer';
import { UI_CONTEXTS } from '../Contexts';
import WalletPage from '../Pages/WalletPage';
import { testTx } from '../testData/Transactions';
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadJournalData, loadWalletData, loadCanisterData, recoverState } from '../Components/loadingFunctions';
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
        journalTypes:types,
        walletTypes,
        accountTypes,
        homePageTypes,
        actorTypes
    }

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route

    const location = useLocation();

    // dispatch state from previous route to redux store if that state exists

    recoverState(journalState, location, ReducerDispatches, ReducerTypes, connectionResult);

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
        if(walletState.shouldReload){
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let walletDataFromApi = await actorState.backendActor.readWalletData()
            if(!walletDataFromApi) return;
            if("err" in walletDataFromApi) walletDataFromApi = await CreateUserJournal(actorState, journalDispatch, 'readWalletData');
            if("err" in walletDataFromApi) {
                journalDispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            };
            await loadWalletData(walletDataFromApi, walletDispatch, walletTypes);
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        }; 
        if(journalState.reloadStatuses.canisterData){
            //Load canister data in background
            const canisterData = await actorState.backendActor.getCanisterData();
            loadCanisterData(canisterData, homePageDispatch, homePageTypes);
        }
        if(journalState.reloadStatuses.journalData){
            //Load Journal Data in the background

            const journal = await actorState.backendActor.readJournal();
            loadJournalData(journal.ok, journalDispatch, types);

        };
        
    },[actorState.backendActor]);

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