import React, {useContext} from "react";
import { AppContext as JournalContext } from "../App";
import { AppContext as AccountContext } from "../AccountPage";
// import { AppContext as PodcastContext } from "../PodcastPage"
import "./LoginPage.scss";


const LoginPage = (props) => {

    const {
        context
    } = props

    let properContext;
    if(context === 'journal'){
        properContext = JournalContext
    } else if(context === 'accountPage'){
        properContext = AccountContext
    } 
    // else if(context === 'podcast'){
    //     properContext = PodcastContext
    // }

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

        <div>
            <div className={'loginPageDiv'}>
            <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo"/>
            <button className={`loginButtonDiv__${(loginAttempted) ? "open" : 'closed'}`} onClick={handleClick}> {(loginAttempted) ? 'Open Journal' : 'Log In Using Internet Identity'} </button>
            </div>
        </div>
    );

}

export default LoginPage; 