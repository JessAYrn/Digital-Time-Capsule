import React, {useContext} from "react";
import { AppContext } from "../App";
import "./LoginPage.scss";


const LoginPage = (props) => {
    const {    
            authClient, 
            setIsLoaded, 
            loginAttempted, 
            setLoginAttempted, 
            actor,
            isAuthenticated
        } = useContext(AppContext);

        const handleClick = async () => {

            setIsLoaded(false);

            if(loginAttempted){
                actor.readJournal().then((result) => {
                    console.log(result);
                    if("err" in result){
                        actor.create({userName: "JesseTheGreat"}).then((result) => {
                            if("err" in result){
                                alert("No Internet Identity Detected");
                            };
                        });
                    } else {
                        console.log(result);
                    }
                });
                
            } else {

                await authClient.login({identityProvider : process.env.II_URL});
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