import React, {useReducer, createContext, useEffect, useState, useMemo} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from './Pages/authentication/LoginPage';
import { UI_CONTEXTS } from '../functionsAndConstants/Contexts';
import { recoverState, loadAllDataIntoReduxStores, allStatesLoaded } from '../functionsAndConstants/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import GroupJournalPage from './Pages/GroupJournalPage';
import { DEFAULT_APP_CONTEXTS } from '../functionsAndConstants/Constants';
import walletReducer, { walletInitialState,walletTypes } from '../reducers/walletReducer';
import homePageReducer, { homePageInitialState,homePageTypes } from '../reducers/homePageReducer';
import accountReducer, { accountInitialState,accountTypes } from '../reducers/accountReducer';
import actorReducer, { actorInitialState,actorTypes } from '../reducers/actorReducer';
import notificationsReducer, {notificationsInitialState, notificationsTypes} from "../reducers/notificationsReducer";
import treasuryReducer, {treasuryPageInitialState, treasuryTypes} from "../reducers/treasuryReducer";
import ModalComponent from '../Components/modal/Modal';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const GroupJournal = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [treasuryState, treasuryDispatch] = useReducer(treasuryReducer, treasuryPageInitialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [homePageState, homePageDispatch] =  useReducer(homePageReducer, homePageInitialState)
    const [accountState, accountDispatch] =  useReducer(accountReducer, accountInitialState)
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);
    
    const [stateHasBeenRecovered, setStateHasBeenRecovered] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

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
    
    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
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
            treasuryState,
            accountState,
            homePageState
        });
    },[
        journalState.isAuthenticated, 
        accountState.dataHasBeenLoaded,
        treasuryState.dataHasBeenLoaded,
        journalState.dataHasBeenLoaded,
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
        treasuryState,
        treasuryDispatch
    }}
    >
        {           
                displayComponent ? 
                <GroupJournalPage/> : 
                <LoginPage
                        context={UI_CONTEXTS.GROUPJOURNAL}
                /> 
        }
        <ModalComponent 
            {...modalProps}
            open={modalIsOpen} 
            isLoading={isLoadingModal} 
        />        

    </AppContext.Provider>
  )
}

export default GroupJournal;