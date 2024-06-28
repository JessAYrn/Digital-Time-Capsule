import React, {useState, useReducer, useEffect, useMemo} from 'react';
import notificationsReducer, { notificationsInitialState, notificationsTypes } from './reducers/notificationsReducer';
import journalReducer, { initialState, types } from './reducers/journalReducer';
import { allStatesLoaded, loadAllDataIntoReduxStores } from './functionsAndConstants/loadingFunctions';
import walletReducer, { walletInitialState, walletTypes } from './reducers/walletReducer';
import homePageReducer, { homePageInitialState, homePageTypes } from './reducers/homePageReducer';
import treasuryReducer, { treasuryPageInitialState, treasuryTypes } from './reducers/treasuryReducer';
import actorReducer, { actorInitialState, actorTypes } from './reducers/actorReducer';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import { copyText } from './functionsAndConstants/walletFunctions/CopyWalletAddress';
import ButtonField from './Components/Fields/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Analytics from './Routes/Pages/Analytics';
import Journal from './Routes/Pages/Journal';
import Notes from './Routes/Pages/Notes';
import ModalComponent from './Components/modal/Modal';
import LoginPage from './Routes/Pages/LoginPage';
import { NAV_LINKS, JOURNAL_TABS } from './functionsAndConstants/Constants';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import { AppContext } from './Context';
import WalletPage from './Routes/Pages/WalletPage';
import TreasuryPage from './Routes/Pages/TreasuryPage';
import GroupJournalPage from './Routes/Pages/GroupJournalPage';
import { Typography } from '@mui/material';
import CreateAccount from './Components/modal/CreateAccount';

const Router = (props) => {

    const [route, setRoute] = useState(NAV_LINKS.dashboard);

    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [homePageState, homePageDispatch] = useReducer(homePageReducer, homePageInitialState);
    const [treasuryState, treasuryDispatch] = useReducer(treasuryReducer, treasuryPageInitialState);
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);
    
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        homePageDispatch,
        actorDispatch,
        notificationsDispatch,
        treasuryDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        homePageTypes,
        actorTypes,
        notificationsTypes,
        treasuryTypes
    }

    const ReducerStates = {
        journalState,
        walletState,
        homePageState,
        actorState,
        notificationsState,
        treasuryState
    };

    const context = {
        journalState,
        journalDispatch,
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
            const loadSuccessful = await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes);
            if(!loadSuccessful) {
                let hasAccessGranted = await actorState.backendActor.hasAccessGranted();
                const reloadDataIntoReduxStores = async () => { await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes) };
                if(hasAccessGranted){
                    setModalProps({
                        components: [
                            {
                                Component: CreateAccount,
                                props: { setModalIsOpen, reloadDataIntoReduxStores }
                            },
                        ]
                        
                    });
                } else {
                    actorState.backendActor.requestApproval();
                    let {userObject} = actorState;
                    let {principal} = userObject;
                    setModalProps({
                        bigText: "Request For Access Has Been Sent To The DAO Admin", 
                        Icon: DoNotDisturbOnIcon,
                        flexDirection: "column",
                        smallText: "If you are the owner of this application, attempting to log in for the first time, you must log in using the wallet that owns the Utility NFT that corresponds to this server.",
                        components: [
                            {
                                Component: Typography,
                                props: {
                                    children: "Below is your Principal ID. Share it with the DAO admin so they know who to admit: ",
                                }
                            },
                            {
                                Component: ButtonField,
                                props: {
                                    text: `${principal}`,
                                    Icon: ContentCopyIcon,
                                    onClick: async () => { 
                                        const promise = new Promise ((res, rej) => {setModalIsOpen(false); res()});
                                        promise.then(() => { copyText(principal); });
                                    }
                                }
                            },
                        ]
                        
                    })
                }
            };  
            setModalIsOpen(false);
            setIsLoadingModal(false);
        } catch(e){ document.location.reload(); }
    }, [actorState.backendActor]);

    const displayComponent = useMemo(() => {
        return actorState?.userObject?.agent && allStatesLoaded({
            journalState,
            notificationsState,
            walletState,
            homePageState,
            treasuryState
        });
    },[
        actorState.userObject.principal, 
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