import React, {useReducer, createContext, useEffect, useState, useMemo} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from './Pages/LoginPage';
import { UI_CONTEXTS } from '../functionsAndConstants/Contexts';
import { loadAllDataIntoReduxStores, recoverState, allStatesLoaded  } from '../functionsAndConstants/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import TreasuryPage from './Pages/TreasuryPage'
import { DEFAULT_APP_CONTEXTS } from '../functionsAndConstants/Constants';
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import walletReducer,{ walletInitialState, walletTypes } from '../reducers/walletReducer';
import actorReducer, { actorInitialState, actorTypes } from '../reducers/actorReducer';
import homePageReducer,{ homePageInitialState, homePageTypes } from '../reducers/homePageReducer';
import notificationsReducer, {notificationsInitialState, notificationsTypes} from "../reducers/notificationsReducer";
import treasuryReducer, {treasuryPageInitialState, treasuryTypes} from "../reducers/treasuryReducer";
import ModalComponent from '../Components/modal/Modal';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const Treasury = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [walletState, walletDispatch]=useReducer(walletReducer,walletInitialState);
    const [actorState, actorDispatch]= useReducer(actorReducer, actorInitialState);
    const [homePageState, homePageDispatch]= useReducer(homePageReducer, homePageInitialState);
    const [treasuryState, treasuryDispatch]= useReducer(treasuryReducer, treasuryPageInitialState);
    
    const [stateHasBeenRecovered, setStateHasBeenRecovered] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        actorDispatch,
        homePageDispatch,
        notificationsDispatch,
        treasuryDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes,
        actorTypes,
        homePageTypes,
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
    
    //gets state from previous route
    const location = useLocation()
    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult, setStateHasBeenRecovered );
    
    
    useEffect( async () => {
        if(!actorState.backendActor) return;
        setIsLoadingModal(true);
        setModalIsOpen(true);
        const response = await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes, stateHasBeenRecovered);
        setModalIsOpen(response?.openModal);
        setModalProps(response)
        setIsLoadingModal(false);
    }, [actorState.backendActor]);

    const displayComponent = useMemo(() => {
        return journalState.isAuthenticated && allStatesLoaded({
            journalState,
            notificationsState,
            walletState,
            accountState,
            treasuryState,
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
        treasuryState,
        treasuryDispatch
    }}
    >
        {           
                displayComponent ? 
                <TreasuryPage/> : 
                <LoginPage context={UI_CONTEXTS.TREASURY}/> 
        }
        <ModalComponent 
            {...modalProps}
            open={modalIsOpen} 
            isLoading={isLoadingModal} 
        />
    </AppContext.Provider>
  )
}

export default Treasury;