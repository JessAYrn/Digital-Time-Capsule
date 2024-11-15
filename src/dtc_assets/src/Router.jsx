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
    const [modalIsLoading, setModalIsLoading] = useState(false);
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
        modalIsOpen,
        setModalIsOpen,
        modalIsLoading,
        setModalIsLoading,
        modalProps,
        setModalProps
    };

    useEffect( async () => {
        if(!actorState.backendActor) return;
        try{
            setModalIsLoading(true);
            setModalIsOpen(true);
            const loadSuccessful = await loadAllDataIntoReduxStores(actorState, ReducerDispatches, ReducerTypes);
            if(loadSuccessful) setModalIsOpen(false);
            else {
                let hasAccessGranted = await actorState.backendActor.hasAccessGranted();
                const reloadDataIntoReduxStores = async () => { await loadAllDataIntoReduxStores(actorState, ReducerDispatches, ReducerTypes) };
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
                    let bigTextmsg = "Request For Access Has Been Sent To The DAO Admin";
                    let response = await actorState.backendActor.requestApproval();
                    if(response.err) { 
                        bigTextmsg = Object.keys(response.err)[0];
                        smallTextMsg = "Your request for could not be submitted. Please try again later."
                    };
                    let {userCredentials} = actorState;
                    let {principal} = userCredentials;
                    setModalProps({
                        bigText: bigTextmsg, 
                        Icon: DoNotDisturbOnIcon,
                        flexDirection: "column",
                        components: [
                            {
                                Component: Typography,
                                props: {
                                    children: "Below is your Principal ID. Share it with the DAO admin so they know who it belongs to: ",
                                }
                            },
                            {
                                Component: ButtonField,
                                props: {
                                    text: `${principal}`,
                                    Icon: ContentCopyIcon,
                                    onClick: () => copyText(principal)
                                }
                            },
                        ]
                        
                    })
                }
            };  
            setModalIsLoading(false);
        } catch(e){ 
            console.log(e)
            await actorState.backendActor.emergencyVoteForToggleSupportModeProposal();
        }
    }, [actorState.backendActor]);

    const displayComponent = useMemo(() => {
        return actorState?.userCredentials?.agent && allStatesLoaded({
            journalState,
            notificationsState,
            walletState,
            homePageState,
            treasuryState
        });
    },[
        actorState.userCredentials.principal, 
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
                    <LoginPage />
                }  
                <ModalComponent 
                {...modalProps}
                open={modalIsOpen} 
                isLoading={modalIsLoading} 
                handleClose={() => { setModalProps({}); setModalIsOpen(false) } } 
            />     
            </AppContext.Provider>                 
        </ThemeProvider>
    );
};

export default Router;