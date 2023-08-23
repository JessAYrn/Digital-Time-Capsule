import * as React from 'react';
import { createContext, useState, useEffect, useReducer, useMemo, useState} from 'react';
import { useLocation } from 'react-router-dom';
import Journal from './Pages/Journal';
import LoginPage from './Pages/authentication/LoginPage';
import { UI_CONTEXTS } from '../functionsAndConstants/Contexts';
import walletReducer, { walletTypes,walletInitialState } from '../reducers/walletReducer';
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import { TEST_DATA_FOR_NOTIFICATIONS } from '../testData/notificationsTestData';
import { loadAllDataIntoReduxStores, recoverState} from '../functionsAndConstants/loadingFunctions';
import { useConnect } from "@connect2ic/react";
import Notes from './Pages/Notes';
import { DEFAULT_APP_CONTEXTS, JOURNAL_TABS } from '../functionsAndConstants/Constants';
import homePageReducer,{ homePageInitialState, homePageTypes } from '../reducers/homePageReducer';
import accountReducer,{ accountInitialState, accountTypes } from '../reducers/accountReducer';
import actorReducer, { actorInitialState, actorTypes } from '../reducers/actorReducer';
import notificationsReducer, {notificationsInitialState, notificationsTypes} from "../reducers/notificationsReducer";
import ModalComponent from '../Components/modal/Modal';

export const AppContext = createContext({...DEFAULT_APP_CONTEXTS, submissionsMade: 0, setSubmissionsMade: () => {} });

const App = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [homePageState, homePageDispatch] =  useReducer(homePageReducer, homePageInitialState)
    const [accountState, accountDispatch] =  useReducer(accountReducer, accountInitialState)
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);
    const [stateHasBeenRecovered, setStateHasBeenRecovered] = useState(false);

    const [submissionsMade, setSubmissionsMade] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route
    const location = useLocation();

    const ReducerDispatches={
        journalDispatch,
        walletDispatch,
        homePageDispatch,
        accountDispatch,
        actorDispatch,
        notificationsDispatch
    }

    const ReducerTypes={
        journalTypes:types,       
        walletTypes,
        homePageTypes,
        accountTypes,
        actorTypes,
        notificationsTypes
    }

    const ReducerStates = {
        journalState,
        walletState,
        accountState,
        homePageState,
        actorState,
        notificationsState
    };

    // dispatch state from previous route to redux store if that state exists
    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult, setStateHasBeenRecovered );
   
    // clears useLocation().state upon page refresh so that when the user refreshes the page,
    // changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    useEffect(async () => {
        if(!actorState.backendActor) return;
        setIsLoadingModal(true);
        setModalIsOpen(true);
        const response = await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes, stateHasBeenRecovered);
        setModalIsOpen(response.openModal);
        setModalProps(response)
        setIsLoadingModal(false);
    },[actorState.backendActor]);

    let TabComponent = useMemo(()=>{
        if(journalState.journalPageTab===JOURNAL_TABS.diaryTab) return Journal;
        else return Notes;
    },[journalState.journalPageTab])

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
                submissionsMade,
                setSubmissionsMade,
                actorDispatch,
                notificationsState,
                notificationsDispatch
            }}
        >
            {
                journalState.isAuthenticated ? 
                    <TabComponent/> : 
                    <LoginPage
                        context={UI_CONTEXTS.JOURNAL}
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

export default App;