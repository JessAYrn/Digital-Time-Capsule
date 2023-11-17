import React, {useContext, useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { AppContext as AccountContext} from '../../Account';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as JournalContext} from '../../App';
import { AppContext as WalletContext} from '../../Wallet';
import { AppContext as TreasuryContext} from '../../Treasury';
import { AppContext as GroupJournalContext} from '../../GroupJournal';
import { UI_CONTEXTS, retrieveContext } from "../../../functionsAndConstants/Contexts";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArticleIcon from '@mui/icons-material/Article';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { NAV_LINKS } from "../../../functionsAndConstants/Constants";
import "./LoginPage.scss";
import "../../../SCSS/Animation.scss";
import { ConnectButton, ConnectDialog, useConnect, useCanister } from "@connect2ic/react";
import "@connect2ic/core/style.css"
import ButtonField from "../../../Components/Fields/Button";
import DataField from "../../../Components/Fields/DataField";
import { types } from "../../../reducers/journalReducer";
import { backendActor, isLocalHost, inTrillions, round2Decimals } from "../../../functionsAndConstants/Utils";
import '../../../SCSS/contentContainer.scss'
import AccordionField from "../../../Components/Fields/Accordion";
import { actorTypes } from "../../../reducers/actorReducer";
import Grid from '@mui/material/Unstable_Grid2';
import { homePageTypes } from "../../../reducers/homePageReducer";

const isLocal = isLocalHost();

export const accordionContent=[    
    {
        title:"1.) Navigate to your Personal DAO's unique URL and press the share button circled below ", 
        image: `dtcscreengrab2.png`
    },
    {  
        title:"2.) Select the 'Add to Home Screen' button", 
        image:`dtcscreengrab3.png`
    },
    {
        title:"3.) Enter a title and then press the 'add' button", 
        image: `dtcscreengrab4.png`
    },
    {
        title:"4.) Your Personal DAO app will then be installed and visible on yoru Home Screen", 
        image:`dtcscreengrab1.png`
    },

];

const LoginPage = (props) => {

    const {
        context
    } = props

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);

    const { 
        journalState, 
        journalDispatch, 
        actorState, 
        actorDispatch,
        walletState,
        walletDispatch,
        accountState,
        accountDispatch,
        homePageState,
        homePageDispatch 
    } = useContext(AppContext);
    
    const [isLoading, setIsLoading] = useState(false);
    const [anonymousActor_dtc] = useCanister('dtc');

    let navigate = useNavigate();

    //must remove function from state because useNavigate will send a null state if there is a function in the state.
    //the reason this happens is because objects retrieved from useLocation must be serializable and function are not.
    let reduxStates = {
        journal: journalState,
        wallet: walletState,
        account: accountState,
        homePage: homePageState
    };

    const changeRoute = (route, states) => {
        navigate(route, { replace: false, state: states });
    };
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    useEffect(async () => {
        let promises = [anonymousActor_dtc.getCanisterCyclesBalances(), anonymousActor_dtc.heartBeat()];
        let [result_0, result_1] = await Promise.all(promises);
        const {currentCyclesBalance_backend, currentCyclesBalance_frontend} = result_0;
        homePageDispatch({
            payload: {
                currentCyclesBalance_backend: parseInt(currentCyclesBalance_backend),
                currentCyclesBalance_frontend: parseInt(currentCyclesBalance_frontend)
            },
            actionType: homePageTypes.SET_CANISTERS_CYCLES_BALANCES
        });
        setIsLoading(false);
    },[]);

    useEffect(async () => {
        if(connectionResult.activeProvider){
            const backendActor_  = await backendActor(connectionResult.activeProvider);
            actorDispatch({
                actionType: actorTypes.SET_BACKEND_ACTOR,
                payload: backendActor_
            })
        }
        setIsLoading(true);
        journalDispatch({
            actionType: types.SET_IS_AUTHENTICATED,
            payload: connectionResult.isConnected
        });
    }, [connectionResult.isConnected]);

    return(
        <Grid container columns={12} xs={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center">
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <img 
                    className={`img`}
                    src={'P2.svg'}
                    alt="Logo"
                />
            </Grid>
            <Grid container xs={11} md={9}>
                <Grid xs display="flex" justifyContent="center" alignItems="center">
                    <ButtonField
                        active={context === UI_CONTEXTS.WALLET}
                        Icon={AccountBalanceWalletIcon}
                        iconSize={'large'}
                        iconColor={'#917153'}
                        onClick={() => changeRoute(NAV_LINKS.wallet, reduxStates)}
                        withBox={true}
                    />
                </Grid>
                <Grid xs display="flex" justifyContent="center" alignItems="center">
                    <ButtonField
                        Icon={ArticleIcon}
                        active={context === UI_CONTEXTS.JOURNAL}
                        iconSize={'large'}
                        iconColor={'#917153'}
                        onClick={() => changeRoute(NAV_LINKS.journal, reduxStates)}
                        withBox={true}
                    />
                </Grid>
            </Grid>
            <Grid container xs={11} md={9}>
                <Grid xs display="flex" justifyContent="center" alignItems="center">
                    <ButtonField
                        active={context === UI_CONTEXTS.HOME_PAGE}
                        Icon={DashboardIcon}
                        iconSize={'large'}
                        iconColor={'#917153'}
                        onClick={() => changeRoute(NAV_LINKS.dashboard, reduxStates)}
                        withBox={true}
                    />
                </Grid>
                <Grid xs display="flex" justifyContent="center" alignItems="center">
                    <ButtonField
                        active={context === UI_CONTEXTS.ACCOUNT_PAGE}
                        Icon={AccountBoxIcon}
                        iconSize={'large'}
                        iconColor={'#917153'}
                        onClick={() => changeRoute(NAV_LINKS.account, reduxStates)}
                        withBox={true}
                    />
                </Grid>
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <ConnectButton/>
                <ConnectDialog />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <DataField
                    label={'Front-end Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_frontend))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <DataField
                    label={'Back-end Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_backend))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <AccordionField>
                    <div title={accordionContent[0].title} image={accordionContent[0].image}></div>
                    <div title={accordionContent[1].title} image={accordionContent[1].image}></div>
                    <div title={accordionContent[2].title} image={accordionContent[2].image}></div>
                    <div title={accordionContent[3].title} image={accordionContent[3].image}></div>
                </AccordionField>
            </Grid>
        </Grid>
    );
}

export default LoginPage; 