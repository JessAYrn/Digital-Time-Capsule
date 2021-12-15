import React, {useContext} from "react";
import { AppContext } from "../App";
import "./LoginPage.scss";


const LoginPage = (props) => {
    const {    
            authClient, 
            setAuthClient,
            setIsLoaded, 
            loginAttempted, 
            setLoginAttempted, 
            actor,
        } = useContext(AppContext);

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