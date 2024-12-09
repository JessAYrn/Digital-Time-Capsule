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
import CelebrationIcon from '@mui/icons-material/Celebration';
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
import CreateAccount from './Components/modal/CreateAccount';
import { fromE8s, shortenHexString } from './functionsAndConstants/Utils';

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

    const ReducerDispatches={ walletDispatch, journalDispatch, homePageDispatch, actorDispatch, notificationsDispatch, treasuryDispatch };
    const ReducerTypes={ journalTypes:types, walletTypes, homePageTypes, actorTypes, notificationsTypes, treasuryTypes };
    const context = { journalState, journalDispatch, walletDispatch, walletState, homePageDispatch, homePageState, actorDispatch, actorState, notificationsState, notificationsDispatch, treasuryState, treasuryDispatch, setRoute, modalIsOpen, setModalIsOpen, modalIsLoading, setModalIsLoading, modalProps, setModalProps };

    const loadAllDataIntoReduxStores_ =  async () => { const result = await loadAllDataIntoReduxStores(actorState, ReducerDispatches, ReducerTypes); return result };

    useEffect( async () => {
        if(!actorState.backendActor) return;
        try{

            setModalIsLoading(true);
            setModalIsOpen(true);
            const {loadSuccessful} = await loadAllDataIntoReduxStores_();
            if(loadSuccessful) { setModalIsLoading(false); setModalIsOpen(false); return; };

            let modalProps = {};
            
            try{
                let {approved, paidEntryCost} = await actorState.backendActor.requestEntryToDao();
                if(approved && paidEntryCost){
                    modalProps = {
                        components: [
                            {
                                Component: CreateAccount,
                                props: { setModalIsOpen, loadAllDataIntoReduxStores_ }
                            },
                        ]
                    };
                } else if(!approved){
                    let {userCredentials} = actorState;
                    let {principal} = userCredentials;

                    modalProps = {
                        bigText: "Request For Access Has Been Sent To The DAO Admin",
                        smallText: "Below is your Principal ID. Share it with the DAO admin so they know who it belongs to: ",
                        Icon: DoNotDisturbOnIcon,
                        flexDirection: "column",
                        components: [
                            {
                                Component: ButtonField,
                                props: { text: `${principal}`, Icon: ContentCopyIcon, onClick: () => copyText(principal) }
                            },
                        ]
                    } 
                } else if(!paidEntryCost){
                    let {costToEnterDao, address, balance} = await actorState.backendActor.getNewUserEntryDepositAddressAndBalance();
                    modalProps = {
                        bigText: "Request For Access Has Been Sent To The DAO Admin",
                        smallText: ` You currently have ${fromE8s(parseInt(balance))} $ICP deposited. Before entry, you must deposit ${ fromE8s(parseInt(costToEnterDao))} $ICP to the address below, refresh the browser, and log in again:  `,
                        Icon: CelebrationIcon,
                        flexDirection: "column",
                        components: [
                            {
                                Component: ButtonField,
                                props: { text: `${shortenHexString(address)}`, Icon: ContentCopyIcon, onClick: () => copyText(address) }
                            },
                        ]
                    };
                }
            } catch(e){ modalProps = { bigText: e, smallText: "Your request for could not be submitted. Please try again later." }; };

            console.log("approved: ", approved);
            console.log("paidEntryCost: ", paidEntryCost);

            setModalIsLoading(false);
            setModalProps(modalProps);

        } catch(e){ console.log(e); await actorState.backendActor.emergencyVoteForToggleSupportModeProposal(); }

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