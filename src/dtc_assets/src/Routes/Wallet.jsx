import React, { createContext, useReducer, useEffect, useMemo, useState} from 'react';
import LoginPage from './Pages/LoginPage';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import walletReducer ,{walletInitialState, walletTypes} from '../reducers/walletReducer';
import { UI_CONTEXTS } from '../functionsAndConstants/Contexts';
import WalletPage from './Pages/WalletPage';
import { testTx } from '../testData/Transactions';
import { recoverState, loadAllDataIntoReduxStores, allStatesLoaded } from '../functionsAndConstants/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import { DEFAULT_APP_CONTEXTS, WALLET_TABS } from '../functionsAndConstants/Constants';
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import homePageReducer,{ homePageInitialState, homePageTypes } from '../reducers/homePageReducer';
import actorReducer , { actorInitialState, actorTypes } from '../reducers/actorReducer';
import notificationsReducer, {notificationsInitialState, notificationsTypes} from "../reducers/notificationsReducer";
import treasuryReducer, {treasuryPageInitialState, treasuryTypes} from "../reducers/treasuryReducer";
import ModalComponent from '../Components/modal/Modal';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const WalletApp = () => {

    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [treasuryState, treasuryDispatch] = useReducer(treasuryReducer, treasuryPageInitialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [homePageState, homePageDispatch] = useReducer(homePageReducer, homePageInitialState);
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);
    
    const [stateHasBeenRecovered, setStateHasBeenRecovered] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const ReducerDispatches = {
        walletDispatch,
        journalDispatch,
        accountDispatch,
        homePageDispatch,
        actorDispatch,
        notificationsDispatch,
        treasuryDispatch
    }

    const ReducerTypes = {
        journalTypes: types,
        walletTypes,
        accountTypes,
        homePageTypes,
        actorTypes,
        notificationsTypes,
        treasuryTypes
    }

    const ReducerStates = {
        journalState,
        walletState,
        accountState,
        homePageState,
        actorState,
        notificationsState,
        treasuryState
    };

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route

    const location = useLocation();

    // dispatch state from previous route to redux store if that state exists
    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult, setStateHasBeenRecovered );

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.

    window.onbeforeunload = window.history.replaceState(null, '');

    const displayComponent = useMemo(() => {
        return journalState.isAuthenticated && allStatesLoaded({
            journalState,
            notificationsState,
            walletState,
            treasuryState,
            accountState,
            homePageState
        });
    },[
        journalState.isAuthenticated, 
        accountState.dataHasBeenLoaded,
        journalState.dataHasBeenLoaded,
        treasuryState.dataHasBeenLoaded,
        walletState.dataHasBeenLoaded,
        homePageState.dataHasBeenLoaded,
        notificationsState.dataHasBeenLoaded,
        actorState.dataHasBeenLoaded
    ])


    //Loading Time Capsule Data
    useEffect(async () => {
        if(!actorState.backendActor) return; 
        setIsLoadingModal(true);
        setModalIsOpen(true);
        const response = await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes, stateHasBeenRecovered);
        setModalIsOpen(response?.openModal);
        setModalProps(response)
        setIsLoadingModal(false);
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
                    actorState,
                    notificationsState,
                    notificationsDispatch,
                    treasuryState,
                    treasuryDispatch
                }}
            >
                {
                    displayComponent ?
                        <WalletPage/> : 
                        <LoginPage
                            context={UI_CONTEXTS.WALLET}
                        /> 
                }
                <ModalComponent 
                    {...modalProps}
                    open={modalIsOpen} 
                    isLoading={isLoadingModal} 
                />
            </AppContext.Provider>
    );

}

export default WalletApp;