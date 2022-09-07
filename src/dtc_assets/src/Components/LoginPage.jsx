import React, {useContext} from "react";
import { AppContext as JournalContext } from "../App";
import { AppContext as AccountContext } from "../Account";
import { AppContext as WalletContex } from "../Wallet";
import { AppContext as HomePageContext } from "../HomePage";
import { AppContext as NftPageContext } from "../NFTs";
import { UI_CONTEXTS } from "../Contexts";
// import { AppContext as PodcastContext } from "../PodcastPage"
import "./LoginPage.scss";
import "../Components/animations/Animation.scss";
import { getIntObserverFunc, visibilityFunctionLoginPage } from "./animations/IntersectionObserverFunctions";

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
            authClient, 
            setIsLoaded, 
            loginAttempted, 
            setLoginAttempted, 
        } = useContext(properContext);

    const handleClick = async () => {

        setIsLoaded(false);

        if(!loginAttempted){
            await authClient.login({identityProvider : process.env.II_URL});
            setLoginAttempted(!loginAttempted);
        } else {
            setLoginAttempted(!loginAttempted);
        }
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

    return(
        <div className={"container_loginPage"} >
            <div className={'container_1'}>
                <div className={'contentContainer animatedLeft _0 login'}>
                    <div className={'contentDiv__loginContent animatedLeft _0'}>
                        <img className={'logoImg animatedLeft _0'}src="dtc-logo-black.png" alt="Logo"/>
                        <button className={`loginButtonDiv__${(loginAttempted) ? "open" : 'closed'} animatedLeft _0`} onClick={handleClick}> {(loginAttempted) ? 'Open Journal' : 'Log In Using Internet Identity'} </button>
                        <div className={'icpLogoDiv animatedLeft _0'}>
                            <img className={'logoImg'}src="logo.png" alt="Logo"/>
                        </div>
                    </div>
                </div>
                <div className={"contentContainer animatedLeft _1"}>
                    <div className={"contentDiv__features animatedLeft _1"}>
                        <div className={"list animatedLeft _1"}>
                            <h6 className={" animatedLeft _1 h6Tag"}>
                                Store Your Memories
                            </h6>
                            <img className={"cameraImg animatedLeft _1"}src="camera.png" alt="camera"/>
                        </div>
                    </div>
                </div>
                <div className={"contentContainer animatedLeft _2"}>
                    <div className={"contentDiv__features animatedLeft _2"}>
                        <div className={"list animatedLeft _2"}>
                        <img className={"bitcoinImg animatedLeft _2"}src="bitcoin.png" alt="bitcoin"/>
                            <h6 className={" animatedLeft _2 h6Tag"}>
                                Store Your Crypto
                            </h6>
                        </div>
                    </div>
                </div>
                <div className={"contentContainer animatedLeft _3"}>
                    <div className={"contentDiv__features animatedLeft _3"}>
                        <div className={"list animatedLeft _3"}>
                            <h6 className={" animatedLeft _3 h6Tag"}>
                                Store Your Passwords
                            </h6>
                            <img className={"safeImg animatedLeft _3"}src="safe-image.png" alt="safe"/>
                        </div>
                    </div>
                </div>
                <div className={"contentContainer animatedLeft _4"}>
                    <div className={"contentDiv__features animatedLeft _4"}>
                        <div className={"list animatedLeft _4"}>
                            <h4 className={"animatedLeft _4 h4Tag"}>
                                All In One Place
                            </h4>
                        </div>
                    </div>
                </div>
                <div className={"contentContainer animatedLeft _5"}>
                    <div className={"contentDiv__sentences animatedLeft _5"}>
                    <div className={"sentences animatedLeft _5"}>
                            <p>
                                The invention of blockchain technology enables us be to able to store our sensitive data in a decentralized,
                                secure manner. The Digital Time Capsule is an application built and hosted entirely on the Internet Computer blockchain.
                            </p>
                        </div>
                    </div>
                </div>
                <div className={"contentContainer animatedLeft _6"}>
                    <div className={"contentDiv__sentences animatedLeft _6"}>
                    <div className={"sentences animatedLeft _6"}>
                            <p>
                                The Digital Time Capsule leverages the security of the blockchain to allow users to store digital assets of sentimental 
                                and monetary value all in one safe location- free of worry. Access to your data is granted using 
                                your internet identity as opposed to the traditional username and password. 
                            </p>
                        </div>
                    </div>
                </div>
                <div className={"contentContainer animatedLeft _7"}>
                    <div className={"contentDiv__sentences animatedLeft _7"}>
                    <div className={"sentences animatedLeft _7"}>
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
                <h4 id={'title'} className={"animatedRight scrollForMore animate"}> Scroll Down For More Info</h4>
            </div>
        </div>
    );

}

export default LoginPage; 