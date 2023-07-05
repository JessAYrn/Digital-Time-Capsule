import React, {useContext, useEffect, useState, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import { AppContext as AccountContext} from '../../Routes/Account';
import { AppContext as HomePageContext} from '../../Routes/HomePage';
import { AppContext as JournalContext} from '../../Routes/App';
import { AppContext as WalletContext} from '../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../Routes/GroupJournal';
import { UI_CONTEXTS, retrieveContext } from "../../Contexts";
import * as IoiosIcons from 'react-icons/io';
import * as AiIcons from 'react-icons/ai';
import * as RiIcons from 'react-icons/ri';
import { NAV_LINKS } from "../../Constants";
import "./LoginPage.scss";
import "../../Components/animations/Animation.scss";
import { getIntObserverFunc, visibilityFunctionLoginPage } from "../animations/IntersectionObserverFunctions";
import { ConnectButton, ConnectDialog, useConnect, useCanister } from "@connect2ic/react";
import "@connect2ic/core/style.css"
import ButtonField from "../Fields/Button";
import DataField from "../Fields/DataField";
import { types } from "../../reducers/journalReducer";
import { backendActor, managerActor } from "../../Utils";
import '../../SCSS/contentContainer.scss'
import Accordion from "../Fields/Accordion";
import { actorTypes } from "../../reducers/actorReducer";

const AccordionContent=[

    {text:"1.) Navigate to your Personal DAO's unique URL and press the share button circled below ", image:'assets/dtcscreengrab2.png'},
    {text:"2.) Select the 'Add to Home Screen' button", image:'assets/dtcscreengrab3.png'},
    {text:"3.) Enter a title and then press the 'add' button", image:'assets/dtcscreengrab4.png'},
    {text:"4.) Your Personal DAO app will then be installed and visible on yoru Home Screen", image:'assets/dtcscreengrab1.png'},

]

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
    let journalStateWithoutFunction = {
        ...journalState,
        handlePageSubmitFunction:'',
        backendActor: undefined,
        managerActor: undefined,
    };
    

    const  handleClickDashboard = useCallback(() =>  {
        navigate(NAV_LINKS.dashboard, { replace: false, state: journalStateWithoutFunction});
    }, [journalState.shouldReload, homePageState.shouldReload, walletState.shouldReload]);

    const  handleClickWallet = useCallback(() =>  {
        navigate(NAV_LINKS.wallet, { replace: false, state: journalStateWithoutFunction});
    }, [journalState.shouldReload, homePageState.shouldReload, walletState.shouldReload]);

    const  handleClickJournal = useCallback(() =>  {
        navigate(NAV_LINKS.journal, { replace: false, state: journalStateWithoutFunction });
    }, [journalState.shouldReload, homePageState.shouldReload, walletState.shouldReload]);

    const  handleClickAccount = useCallback(() =>  {
        navigate(NAV_LINKS.account, { replace: false, state: journalStateWithoutFunction });
    },[journalState.shouldReload, homePageState.shouldReload, walletState.shouldReload]);
   
    const  handleClickTreasury = useCallback(() =>  {
        navigate(NAV_LINKS.treasury, { replace: false, state: journalStateWithoutFunction });
    },[journalState.shouldReload, homePageState.shouldReload, walletState.shouldReload]);

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

    const containers = document.querySelectorAll(".contentContainer");
    containers.forEach( (container, index) => {
        let props_ = {
            containerIndex: index, 
            className: "animatedLeft",
            visibilityFunction: visibilityFunctionLoginPage
        };
        const observer = new IntersectionObserver(getIntObserverFunc(props_), {threshold: .6});
        observer.observe(container);
    });

    let animatedLeftElementIndex = 0;

    return(
        <div className={"container_loginPage"}>
            <div className={'containerInner_loginPage'}>
                <div className={`contentContainer _${animatedLeftElementIndex} login`}>
                    <div className={`contentDiv__loginContent _${animatedLeftElementIndex++}`}>
                        <div className={`logoDiv login`}>
                            <img className={`logoImg`}src="dtc-logo-black.png" alt="Logo"/>
                        </div>
                        <div className={'row'}>
                            <ButtonField
                                Icon={IoiosIcons.IoIosWallet}
                                iconSize={25}
                                iconColor={'#917153'}
                                className={`walletIconDiv loginPage ${(context === UI_CONTEXTS.WALLET) ? 'active' : ''}`}
                                onClick={handleClickWallet}
                                withBox={true}
                            />
                            <ButtonField
                                Icon={IoiosIcons.IoIosJournal}
                                iconSize={25}
                                iconColor={'#917153'}
                                className={`journalIconDiv loginPage ${(context === UI_CONTEXTS.JOURNAL) ? 'active' : ''}`}
                                onClick={handleClickJournal}
                                withBox={true}
                            />
                        </div>
                        <div className={'row'}>
                            <ButtonField
                                Icon={AiIcons.AiFillDashboard}
                                iconSize={25}
                                iconColor={'#917153'}
                                className={`dashboardIconDiv loginPage ${(context === UI_CONTEXTS.HOME_PAGE) ? 'active' : ''}`}
                                onClick={handleClickDashboard}
                                withBox={true}
                            />
                            <ButtonField
                                Icon={RiIcons.RiAccountPinCircleFill}
                                iconSize={25}
                                iconColor={'#917153'}
                                className={`accountIconDiv loginPage ${(context === UI_CONTEXTS.ACCOUNT_PAGE) ? 'active' : ''}`}
                                onClick={handleClickAccount}
                                withBox={true}
                            />
                        </div>
                        <ConnectButton/>
                        <ConnectDialog />
                        <DataField
                            label={'Front-end Canister Balance: '}
                            className={'loginPage'}
                            isCycles={true}
                            text={isLoading ? 'Loading...' : frontendCanisterBalance}
                        />
                        <DataField
                            label={'Back-end Canister Balance: '}
                            className={'loginPage'}
                            isCycles={true}
                            text={isLoading ? 'Loading...' : backendCanisterBalance}
                        />

                        <Accordion
                        title='Install App'
                        content={AccordionContent}
                        />
                    </div>
                </div>
            </div>
            <div className={"container_2"}>
                <h4 id={'title'} className={"scrollForMore"}> Scroll Down For More Info</h4>
            </div>
        </div>
    );

}

export default LoginPage; 