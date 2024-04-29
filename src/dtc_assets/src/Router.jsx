import React, {useState, useReducer, useEffect, useMemo} from 'react';
import notificationsReducer, { notificationsInitialState, notificationsTypes } from './reducers/notificationsReducer';
import journalReducer, { initialState, types } from './reducers/journalReducer';
import { allStatesLoaded, loadAllDataIntoReduxStores } from './functionsAndConstants/loadingFunctions';
import walletReducer, { walletInitialState, walletTypes } from './reducers/walletReducer';
import accountReducer, { accountInitialState, accountTypes } from './reducers/accountReducer';
import homePageReducer, { homePageInitialState, homePageTypes } from './reducers/homePageReducer';
import treasuryReducer, { treasuryPageInitialState, treasuryTypes } from './reducers/treasuryReducer';
import actorReducer, { actorInitialState, actorTypes } from './reducers/actorReducer';
import Analytics from './Routes/Pages/Analytics';
import Journal from './Routes/Pages/Journal';
import Notes from './Routes/Pages/Notes';
import ModalComponent from './Components/modal/Modal';
import LoginPage from './Routes/Pages/LoginPage';
import { NAV_LINKS, JOURNAL_TABS } from './functionsAndConstants/Constants';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import { AppContext } from './Context';
import AccountSection from './Routes/Pages/AccountPage';
import WalletPage from './Routes/Pages/WalletPage';
import TreasuryPage from './Routes/Pages/TreasuryPage';
import GroupJournalPage from './Routes/Pages/GroupJournalPage';

const Router = (props) => {

    const [route, setRoute] = useState(NAV_LINKS.dashboard);

    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [homePageState, homePageDispatch] = useReducer(homePageReducer, homePageInitialState);
    const [treasuryState, treasuryDispatch] = useReducer(treasuryReducer, treasuryPageInitialState);
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);
    
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        homePageDispatch,
        actorDispatch,
        notificationsDispatch,
        treasuryDispatch
    }

    const ReducerTypes={
        journalTypes:types,
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

    const context = {
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
        treasuryDispatch,
        setRoute,
        setModalIsOpen,
        setIsLoadingModal,
        setModalProps
    };

    useEffect( async () => {
        if(!actorState.backendActor) return;
        try{
            setIsLoadingModal(true);
            setModalIsOpen(true);
            let response = await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes);
            setModalIsOpen(response?.openModal);
            setModalProps(response)
            setIsLoadingModal(false);    
        } catch(e){ 
            // disconnect the user if there is an error
            document.location.reload(); 
        }
    }, [actorState.backendActor]);

    const displayComponent = useMemo(() => {
        return actorState?.userObject?.agent && allStatesLoaded({
            journalState,
            notificationsState,
            walletState,
            accountState,
            homePageState,
            treasuryState
        });
    },[
        actorState.userObject.principal, 
        accountState.dataHasBeenLoaded,
        treasuryState.dataHasBeenLoaded,
        journalState.dataHasBeenLoaded,
        walletState.dataHasBeenLoaded,
        homePageState.dataHasBeenLoaded,
        notificationsState.dataHasBeenLoaded,
        actorState.dataHasBeenLoaded
    ])

    let JournalComponent = useMemo(()=>{
        if(journalState.journalPageTab===JOURNAL_TABS.diaryTab) return Journal;
        else return Notes;
    },[journalState.journalPageTab])
    
    return(
       <ThemeProvider theme={theme}>
            <AppContext.Provider value={context}>
                {displayComponent ? 
                    <>
                        {route === NAV_LINKS.dashboard && <Analytics/>}
                        {route === NAV_LINKS.journal && <JournalComponent />}
                        {route === NAV_LINKS.account && <AccountSection />}
                        {route === NAV_LINKS.wallet && <WalletPage />}
                        {route === NAV_LINKS.treasury && <TreasuryPage />}
                        {route === NAV_LINKS.groupJournal && <GroupJournalPage />}
                    </>  : 
                    <LoginPage context={AppContext}/>
                }  
                <ModalComponent 
                {...modalProps}
                open={modalIsOpen} 
                isLoading={isLoadingModal} 
            />     
            </AppContext.Provider>                 
        </ThemeProvider>
    );
};

export default Router;