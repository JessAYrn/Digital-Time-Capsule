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
import Analytics from './Pages/Analytics';
import Journal from './Pages/Journal';
import Notes from './Pages/Notes';
import ModalComponent, {LoadingModal} from './Components/modal/Modal';
import LoginPage from './Pages/LoginPage';
import { NAV_LINKS, JOURNAL_TABS } from './functionsAndConstants/Constants';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import { AppContext } from './Context';
import FinancesPage from './Pages/Finances/FinancesPage';
import GroupJournalPage from './Pages/GroupJournalPage';
import CreateAccount from './Components/modal/CreateAccount';
import { fromE8s, shortenHexString } from './functionsAndConstants/Utils';
import ActionButton from './Components/persistentComponents/ActionButton';
import { NavBar } from './Components/persistentComponents/NavBar';
import Grid from '@mui/material/Unstable_Grid2';
import { Typography } from '@mui/material';

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
                            <CreateAccount  loadAllDataIntoReduxStores_={loadAllDataIntoReduxStores_}/>,
                        ]
                    };
                } else if(!approved){
                    let {userCredentials} = actorState;
                    let {principal} = userCredentials;

                    modalProps = {
                        flexDirection: "column",
                        components: [
                            <Typography padding={"10px"} variant='h6' children={"Request For Access Has Been Sent To The DAO Admin"} />,
                            <DoNotDisturbOnIcon/>,
                            <Typography padding={"10px"} children={"Below is your Principal ID. Share it with the DAO admin so they know who it belongs to: "} />,
                            <ButtonField text={`${principal}`} Icon={ContentCopyIcon} onClick={() => copyText(principal)}/>,
                        ]
                    } 
                } else if(!paidEntryCost){
                    let {costToEnterDao, address, balance} = await actorState.backendActor.getNewUserEntryDepositAddressAndBalance();
                    modalProps = {
                        flexDirection: "column",
                        components: [
                            <Typography variant='h6' children={"You have been approved to enter this DAO"} padding={"10px"}/>,
                            <CelebrationIcon />,
                            <Typography padding={"10px"} children={` You currently have ${fromE8s(parseInt(balance))} $ICP deposited. Before entry, you must deposit ${ fromE8s(parseInt(costToEnterDao))} $ICP to the address below, refresh the browser, and log in again:  `} />,
                            <ButtonField text={`${shortenHexString(address)}`} Icon={ContentCopyIcon} onClick={() => copyText(address)}/>,
                        ]
                    };
                }
            } catch(e){ modalProps = { bigText: e, smallText: "Your request for could not be submitted. Please try again later." }; };

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
            { displayComponent && <NavBar />}
            { displayComponent && <ActionButton/> }
            <Grid 
                container 
                columns={12} 
                xs={12} 
                rowSpacing={8} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"}
                marginTop={"60px"}
            > 
                {displayComponent ? 
                    <>
                        {route === NAV_LINKS.dashboard && <Analytics/>}
                        {route === NAV_LINKS.journal && <JournalComponent />}
                        {route === NAV_LINKS.finances && <FinancesPage />}
                        {route === NAV_LINKS.groupJournal && <GroupJournalPage />}
                    </>  : 
                    <LoginPage />
                }  
                <ModalComponent 
                {...modalProps}
                open={!modalIsLoading && modalIsOpen} 
                handleClose={() => { setModalProps({}); setModalIsOpen(false) } } 
                />   
                <LoadingModal open={modalIsLoading}/>
            </Grid>  
            </AppContext.Provider>                 
        </ThemeProvider>
    );
};

export default Router;