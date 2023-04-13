import React, {useContext, useEffect, useState, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import { AppContext as JournalContext } from "../../Routes/App";
import { AppContext as AccountContext } from "../../Routes/Account";
import { AppContext as WalletContex } from "../../Routes/Wallet";
import { AppContext as HomePageContext } from "../../Routes/HomePage";
import { AppContext as NftPageContext } from "../../Routes/NFTs";
import { UI_CONTEXTS } from "../../Contexts";
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
import { backendActor } from "../../Utils";
import '../../SCSS/contentContainer.scss'

const LoginPage = (props) => {

    const {
        context
    } = props

    let properContext;
    if(context === UI_CONTEXTS.JOURNAL){
        properContext = JournalContext
    } else if(context === UI_CONTEXTS.ACCOUNT_PAGE){
        properContext = AccountContext
    } else if(context === UI_CONTEXTS.WALLET){
        properContext = WalletContex
    } else if(context === UI_CONTEXTS.HOME_PAGE){
        properContext = HomePageContext
    } else if(context === UI_CONTEXTS.NFT){
        properContext = NftPageContext
    } 

    const {    
        journalState,
        dispatch
    } = useContext(properContext);

    const [frontendCanisterBalance, setFrontendCanisterBalance] = useState(0);
    const [backendCanisterBalance, setBackendCanisterBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [anonymousActor] = useCanister('dtc');

    let navigate = useNavigate();

    //must remove function from state because useNavigate will send a null state if there is a function in the state.
    //the reason this happens is because objects retrieved from useLocation must be serializable and function are not.
    let journalStateWithoutFunction = {
        ...journalState,
        handlePageSubmitFunction:'',
        actor: undefined
    };

    const  handleClickDashboard = useCallback(() =>  {
        navigate(NAV_LINKS.dashboard, { replace: false, state: journalStateWithoutFunction});
    }, [journalState.reloadStatuses]);

    const  handleClickWallet = useCallback(() =>  {
        navigate(NAV_LINKS.wallet, { replace: false, state: journalStateWithoutFunction});
    }, [journalState.reloadStatuses]);

    const  handleClickJournal = useCallback(() =>  {
        navigate(NAV_LINKS.journal, { replace: false, state: journalStateWithoutFunction });
    }, [journalState.reloadStatuses]);

    const  handleClickAccount = useCallback(() =>  {
        navigate(NAV_LINKS.account, { replace: false, state: journalStateWithoutFunction });
    },[journalState.reloadStatuses]);

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    useEffect(async () => {
        let result = await anonymousActor.getCanisterCyclesBalances();
        setBackendCanisterBalance(parseInt(result.backendCyclesBalance));
        setFrontendCanisterBalance(parseInt(result.frontendCyclesBalance));
        setIsLoading(false);
    },[]);

    useEffect(async () => {
        if(connectionResult.activeProvider){
            const newActor = await backendActor(connectionResult.activeProvider);
            dispatch({
                actionType: types.SET_ACTOR,
                payload: newActor
            });
        }
        setIsLoading(true);
        dispatch({
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
                    </div>
                </div>
                <div className={`contentContainer _${animatedLeftElementIndex}`}>
                    <div className={`contentDiv__features _${animatedLeftElementIndex++}`}>
                        <div className={`list`}>
                            <h6 className={`h6Tag`}>
                                Store Your Memories
                            </h6>
                            <img className={`cameraImg`}src="../../../assets/camera.png" alt="camera"/>
                        </div>
                    </div>
                </div>
                <div className={`contentContainer animatedLeft _${animatedLeftElementIndex}`}>
                    <div className={`contentDiv__features animatedLeft _${animatedLeftElementIndex++}`}>
                        <div className={`list`}>
                        <img className={`bitcoinImg`}src="bitcoin.png" alt="bitcoin"/>
                            <h6 className={`h6Tag`}>
                                Store Your Crypto
                            </h6>
                        </div>
                    </div>
                </div>
                <div className={`contentContainer animatedLeft _${animatedLeftElementIndex}`}>
                    <div className={`contentDiv__features animatedLeft _${animatedLeftElementIndex++}`}>
                        <div className={`list`}>
                            <h6 className={`h6Tag`}>
                                Store Your Passwords
                            </h6>
                            <img className={`safeImg`}src="safe-image.png" alt="safe"/>
                        </div>
                    </div>
                </div>
                <div className={`contentContainer animatedLeft _${animatedLeftElementIndex}`}>
                    <div className={`contentDiv__features animatedLeft _${animatedLeftElementIndex++}`}>
                        <div className={`list`}>
                            <h4 className={`h4Tag`}>
                                All In One Place
                            </h4>
                        </div>
                    </div>
                </div>
                <div className={`contentContainer animatedLeft _${animatedLeftElementIndex}`}>
                    <div className={`contentDiv__sentences animatedLeft _${animatedLeftElementIndex++}`}>
                        <div className={`sentences`}>
                            <p>
                                The invention of blockchain technology enables us be to able to store our sensitive data in a decentralized,
                                secure manner. The Digital Time Capsule is an application built and hosted entirely on the Internet Computer blockchain.
                            </p>
                        </div>
                    </div>
                </div>
                <div className={`contentContainer animatedLeft _${animatedLeftElementIndex}`}>
                    <div className={`contentDiv__sentences animatedLeft _${animatedLeftElementIndex++}`}>
                        <div className={`sentences`}>
                            <p>
                                The Digital Time Capsule leverages the security of the blockchain to allow users to store digital assets of sentimental 
                                and monetary value all in one safe location- free of worry. Access to your data is granted using 
                                your internet identity as opposed to the traditional username and password. 
                            </p>
                        </div>
                    </div>
                </div>
                <div className={`contentContainer animatedLeft _${animatedLeftElementIndex}`}>
                    <div className={`contentDiv__sentences animatedLeft _${animatedLeftElementIndex++}`}>
                        <div className={`sentences`}>
                            <p>
                                This access feature is more secure than a username and password: 
                                it eliminates the possibility of bad actors being able to remotely 
                                access your data without physical access to a device or devices of 
                                your choice.
                            </p>
                        </div>
                    </div>
                </div>
                <div>

                </div>
            </div>
            <div className={"container_2"}>
                <h4 id={'title'} className={"scrollForMore"}> Scroll Down For More Info</h4>
            </div>
        </div>
    );

}

export default LoginPage; 