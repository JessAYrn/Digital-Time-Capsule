import React, {useContext, useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { AppContext as AccountContext} from '../Account';
import { AppContext as HomePageContext} from '../HomePage';
import { AppContext as JournalContext} from '../App';
import { AppContext as WalletContext} from '../Wallet';
import { AppContext as TreasuryContext} from '../Treasury';
import { AppContext as GroupJournalContext} from '../GroupJournal';
import { UI_CONTEXTS, retrieveContext } from "../../functionsAndConstants/Contexts";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArticleIcon from '@mui/icons-material/Article';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { NAV_LINKS } from "../../functionsAndConstants/Constants";
import { ConnectButton, ConnectDialog, useConnect, useCanister } from "@connect2ic/react";
import "@connect2ic/core/style.css"
import ButtonField from "../../Components/Fields/Button";
import DataField from "../../Components/Fields/DataField";
import { types } from "../../reducers/journalReducer";
import { backendActor, inTrillions, round2Decimals } from "../../functionsAndConstants/Utils";
import AccordionField from "../../Components/Fields/Accordion";
import { actorTypes } from "../../reducers/actorReducer";
import Grid from '@mui/material/Unstable_Grid2';
import { homePageTypes } from "../../reducers/homePageReducer";

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
    }, [connectionResult.isConnected]);

    return(
        <Grid container columns={12} xs={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center">
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <img 
                    style={{maxWidth: "50vw", maxHeight: "50vh"}}
                    className={`img`}
                    src={'P2.svg'}
                    alt="Logo"
                />
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
                <ConnectButton/>
                <ConnectDialog dark={true}/>
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