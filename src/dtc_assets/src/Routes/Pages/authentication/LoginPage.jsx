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
import { backendActor, managerActor } from "../../../functionsAndConstants/Utils";
import '../../../SCSS/contentContainer.scss'
import AccordionField from "../../../Components/Fields/Accordion";
import AccordionField_Outter from "../../../Components/Fields/Accordian_Outter";
import { actorTypes } from "../../../reducers/actorReducer";
import Grid from '@mui/material/Unstable_Grid2';


const accordionContent=[

    {title:"1.) Navigate to your Personal DAO's unique URL and press the share button circled below ", image:'assets/dtcscreengrab2.png'},
    {title:"2.) Select the 'Add to Home Screen' button", image:'assets/dtcscreengrab3.png'},
    {title:"3.) Enter a title and then press the 'add' button", image:'assets/dtcscreengrab4.png'},
    {title:"4.) Your Personal DAO app will then be installed and visible on yoru Home Screen", image:'assets/dtcscreengrab1.png'},

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
    
    const [frontendCanisterBalance, setFrontendCanisterBalance] = useState(0);
    const [backendCanisterBalance, setBackendCanisterBalance] = useState(0);
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
        setBackendCanisterBalance(parseInt(result_0.backendCyclesBalance));
        setFrontendCanisterBalance(parseInt(result_0.frontendCyclesBalance));
        setIsLoading(false);
    },[]);

    useEffect(async () => {
        if(connectionResult.activeProvider){
            const promises = [
                backendActor(connectionResult.activeProvider),
                managerActor(connectionResult.activeProvider)
            ];
            const [backendActor_, managerActor_] = await Promise.all(promises);
            actorDispatch({
                actionType: actorTypes.SET_BACKEND_ACTOR,
                payload: backendActor_
            });
            actorDispatch({
                actionType: actorTypes.SET_MANAGER_ACTOR,
                payload: managerActor_
            });
        }
        setIsLoading(true);
        journalDispatch({
            actionType: types.SET_IS_AUTHENTICATED,
            payload: connectionResult.isConnected
        });
    }, [connectionResult.isConnected]);

    return(
        <Grid container columns={12} xs={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center">
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center">
                <img className={`logoImg`}src="../../../assets/P2.svg" alt="Logo"/>
            </Grid>
            <Grid container xs={12}>
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
            <Grid container xs={12}>
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
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center">
                <ConnectButton/>
                <ConnectDialog />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"66%"}>
                <DataField
                    label={'Front-end Canister Balance: '}
                    className={'loginPage'}
                    isCycles={true}
                    text={frontendCanisterBalance}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"66%"}>
                <DataField
                    label={'Back-end Canister Balance: '}
                    className={'loginPage'}
                    isCycles={true}
                    text={backendCanisterBalance}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"66%"}>
                <AccordionField content={accordionContent}/>
            </Grid>
        </Grid>
    );
}

export default LoginPage; 