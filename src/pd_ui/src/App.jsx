import React, {useState, useReducer, useEffect, useMemo} from 'react';
import notificationsReducer, { notificationsInitialState, notificationsTypes } from './reducers/notificationsReducer';
import journalReducer, { initialState, types } from './reducers/journalReducer';
import { allStatesLoaded, loadAllDataIntoReduxStores } from './functionsAndConstants/loadingFunctions';
import walletReducer, { walletInitialState, walletTypes } from './reducers/walletReducer';
import homePageReducer, { homePageInitialState, homePageTypes } from './reducers/homePageReducer';
import treasuryReducer, { treasuryPageInitialState, treasuryTypes } from './reducers/treasuryReducer';
import navigationAndApiReducer, { navigationAndApiInitialState, navigationAndApiTypes } from './reducers/navigationAndApiReducer';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import { copyText } from './wallet/CopyWalletAddress';
import ButtonField from './components/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CelebrationIcon from '@mui/icons-material/Celebration';
import DashboardPage from './pages/dashboard/DashboardPage';
import ModalComponent, {LoadingModal} from './modals/Modal';
import LoginPage from './pages/LoginPage';
import { NAV_LINKS } from './reducers/navigationAndApiReducer';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import { AppContext } from './Context';
import FinancesPage from './pages/finances/FinancesPage';
import CreateAccount from './modals/CreateAccount';
import { fromE8s, shortenHexString } from './functionsAndConstants/Utils';
import Grid from '@mui/material/Unstable_Grid2';
import { Typography } from '@mui/material';
import PersistedComponents from './components/persistentComponents/PersistedComponents';


const Router = (props) => {

    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [notificationsState, notificationsDispatch] = useReducer(notificationsReducer, notificationsInitialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [homePageState, homePageDispatch] = useReducer(homePageReducer, homePageInitialState);
    const [treasuryState, treasuryDispatch] = useReducer(treasuryReducer, treasuryPageInitialState);
    const [navigationAndApiState, navigationAndApiDispatch] = useReducer(navigationAndApiReducer, navigationAndApiInitialState);
    
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalIsLoading, setModalIsLoading] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const ReducerDispatches={ walletDispatch, journalDispatch, homePageDispatch, navigationAndApiDispatch, notificationsDispatch, treasuryDispatch };
    const ReducerTypes={ journalTypes:types, walletTypes, homePageTypes, navigationAndApiTypes, notificationsTypes, treasuryTypes };
    const context = { journalState, journalDispatch, walletDispatch, walletState, homePageDispatch, homePageState, navigationAndApiDispatch, navigationAndApiState, notificationsState, notificationsDispatch, treasuryState, treasuryDispatch, modalIsOpen, setModalIsOpen, modalIsLoading, setModalIsLoading, modalProps, setModalProps };

    const loadAllDataIntoReduxStores_ =  async () => { const result = await loadAllDataIntoReduxStores(navigationAndApiState, ReducerDispatches, ReducerTypes); return result };

    useEffect( async () => {
        if(!navigationAndApiState.backendActor) return;
        try{

            setModalIsLoading(true);
            setModalIsOpen(true);
            const {loadSuccessful} = await loadAllDataIntoReduxStores_();
            if(loadSuccessful) { setModalIsLoading(false); setModalIsOpen(false); return; };

            let modalProps = {};
            
            try{
                let {approved, paidEntryCost} = await navigationAndApiState.backendActor.requestEntryToDao();
                
                if(approved && paidEntryCost){
                    modalProps = {
                        components: [
                            <CreateAccount  loadAllDataIntoReduxStores_={loadAllDataIntoReduxStores_}/>,
                        ]
                    };
                } else if(!approved){
                    let {userCredentials} = navigationAndApiState;
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
                    let {costToEnterDao, address, balance} = await navigationAndApiState.backendActor.getNewUserEntryDepositAddressAndBalance();
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

        } catch(e){ console.log(e); await navigationAndApiState.backendActor.emergencyVoteForToggleSupportModeProposal(); }

    }, [navigationAndApiState.backendActor]);

    const displayComponent = useMemo(() => {
        return navigationAndApiState?.userCredentials?.agent && allStatesLoaded({
            journalState,
            notificationsState,
            walletState,
            homePageState,
            treasuryState
        });
    },[
        navigationAndApiState.userCredentials.principal, 
        treasuryState.dataHasBeenLoaded,
        journalState.dataHasBeenLoaded,
        walletState.dataHasBeenLoaded,
        homePageState.dataHasBeenLoaded,
        notificationsState.dataHasBeenLoaded,
        navigationAndApiState.dataHasBeenLoaded
    ])
    
    return(
       <ThemeProvider theme={theme}>
            <AppContext.Provider value={context}>
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
            { displayComponent && <PersistedComponents/>}
                {displayComponent ? 
                    <>
                        {navigationAndApiState?.location?.route === NAV_LINKS.dashboard && <DashboardPage/>}
                        {navigationAndApiState?.location.route === NAV_LINKS.finances && <FinancesPage />}
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