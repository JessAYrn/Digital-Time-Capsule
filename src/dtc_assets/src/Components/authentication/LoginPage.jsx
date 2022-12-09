import React, {useContext, useEffect, useState} from "react";
import { AppContext as JournalContext } from "../../App";
import { AppContext as AccountContext } from "../../Account";
import { AppContext as WalletContex } from "../../Wallet";
import { AppContext as HomePageContext } from "../../HomePage";
import { AppContext as NftPageContext } from "../../NFTs";
import { UI_CONTEXTS } from "../../Contexts";
import {StoicIdentity} from "ic-stoic-identity";
// import { AppContext as PodcastContext } from "../PodcastPage"
import "./LoginPage.scss";
import "../../Components/animations/Animation.scss";
import { getIntObserverFunc, visibilityFunctionLoginPage } from "../animations/IntersectionObserverFunctions";
import { TriggerAuththenticateClientFunction } from "./AuthenticationMethods";
import { types } from "../../reducers/journalReducer";
import { delay } from "../../Utils";
import ButtonField from "../Fields/Button";

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
    const [isUsingII, setIsUsingII] = useState(false);
    const [checks, setChecks] = useState(0);

    useEffect(() => {
        if(!checks) return;
        const listenForIIAuthentication = async () => {
            let client = journalState.authClient;
            let authenticated_;
            if(client) authenticated_ = await client.isAuthenticated();
            if(authenticated_) TriggerAuththenticateClientFunction(journalState, dispatch, types);
            else setChecks( checks + 1);
        }
        const listenForReduxStoreStoicIdToUpdate = async () => {
            let stoicId = journalState.stoicIdentity;
            if(stoicId) TriggerAuththenticateClientFunction(journalState, dispatch, types);
            else{
                await delay(1000);
                setChecks( checks + 1);
            };
        }
        if (isUsingII) listenForIIAuthentication();
        else listenForReduxStoreStoicIdToUpdate();
    }, [checks]);

    const handleClick_Stoic = async () => {
        setIsUsingII(false);
        if(!journalState.isAuthenticated){
            await StoicIdentity.load().then(async identity => {
                if (identity !== false) StoicIdentity.disconnect();
                identity = await StoicIdentity.connect();
                dispatch({
                    actionType: types.SET_STOIC_IDENTITY,
                    payload: identity
                });
            });
            setChecks(checks + 1);
        };
    };

    const handleClick_II = async () => {
        setIsUsingII(true);
        if(!journalState.isAuthenticated){
            await StoicIdentity.load().then(async identity => {
                if (identity !== false) StoicIdentity.disconnect(); 
            });
            await journalState.authClient.login({identityProvider : process.env.II_URL});
            setChecks(checks + 1);
        };
    };
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
            <div className={'container_1'}>
                <div className={`contentContainer _${animatedLeftElementIndex} login`}>
                    <div className={`contentDiv__loginContent _${animatedLeftElementIndex++}`}>
                        <img className={`logoImg`}src="dtc-logo-black.png" alt="Logo"/>
                        <ButtonField
                            text={'Log In Using Internet Identity'}
                            className={`loginButtonDiv`}
                            onClick={handleClick_II}
                            withBox={true}
                        />
                        <ButtonField
                            text={'Log In Using Stoic Identity'}
                            className={`loginButtonDiv`}
                            onClick={handleClick_Stoic}
                            withBox={true}
                        />
                        <div className={`icpLogoDiv`}>
                            <img className={'logoImg'}src="logo.png" alt="Logo"/>
                        </div>
                    </div>
                </div>
                <div className={`contentContainer _${animatedLeftElementIndex}`}>
                    <div className={`contentDiv__features _${animatedLeftElementIndex++}`}>
                        <div className={`list`}>
                            <h6 className={`h6Tag`}>
                                Store Your Memories
                            </h6>
                            <img className={`cameraImg`}src="camera.png" alt="camera"/>
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