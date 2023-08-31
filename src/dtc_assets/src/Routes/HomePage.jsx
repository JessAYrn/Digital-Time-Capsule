import React, { createContext, useReducer, useEffect, useState, useMemo} from 'react';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import LoginPage from './Pages/authentication/LoginPage';
import { UI_CONTEXTS } from '../functionsAndConstants/Contexts';
import Analytics from './Pages/Analytics';
import "./HomePage.scss";
import { loadAllDataIntoReduxStores, recoverState, allStatesLoaded } from '../functionsAndConstants/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import { DEFAULT_APP_CONTEXTS } from '../functionsAndConstants/Constants';
import walletReducer,{walletTypes, walletInitialState} from '../reducers/walletReducer'
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import homePageReducer,{homePageInitialState,homePageTypes} from '../reducers/homePageReducer';
import actorReducer, { actorInitialState, actorTypes } from '../reducers/actorReducer';
import notificationsReducer, {notificationsInitialState, notificationsTypes} from "../reducers/notificationsReducer";
import ModalComponent from '../Components/modal/Modal';

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const HomePage = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [homePageState, homePageDispatch] = useReducer(homePageReducer, homePageInitialState);
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);
    
    const [stateHasBeenRecovered, setStateHasBeenRecovered] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route
    const location = useLocation();


    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        homePageDispatch,
        actorDispatch,
        notificationsDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes,
        homePageTypes,
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

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

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
            homePageState
        });
    },[
        journalState.isAuthenticated, 
        accountState.dataHasBeenLoaded,
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
                accountState,
                accountDispatch,
                walletDispatch,
                walletState,
                homePageDispatch,
                homePageState,
                actorDispatch,
                actorState,
                notificationsState,
                notificationsDispatch
            }}
        >

            {           
                displayComponent ? 
                    <Analytics/> : 
                    <LoginPage
                        context={UI_CONTEXTS.HOME_PAGE}
                    /> 
            }
            <ModalComponent 
                {...modalProps}
                open={modalIsOpen} 
                isLoading={isLoadingModal} 
            />      
        </AppContext.Provider>
    );
};

export default HomePage;