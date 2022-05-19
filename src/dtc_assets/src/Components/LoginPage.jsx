import React, {useContext} from "react";
import { AppContext as JournalContext } from "../App";
import { AppContext as AccountContext } from "../AccountPage";
import { AppContext as WalletContex } from "../Wallet";
import { AppContext as HomePageContext } from "../HomePage";
import { AppContext as NftPageContext } from "../NFTs";
import { UI_CONTEXTS } from "../Contexts";
// import { AppContext as PodcastContext } from "../PodcastPage"
import "./LoginPage.scss";


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


    return(

        <div className={'container'}>
            <div className={'background'}>
                <div className={'loginPageDivContainer'}>
                    <div className={'loginPageDiv'}>
                        <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo"/>
                        <button className={`loginButtonDiv__${(loginAttempted) ? "open" : 'closed'}`} onClick={handleClick}> {(loginAttempted) ? 'Open Journal' : 'Log In Using Internet Identity'} </button>
                        <div className={'icpLogoDiv'}>
                            <img className={'logoImg'}src="logo.png" alt="Logo"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default LoginPage; 