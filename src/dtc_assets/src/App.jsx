import * as React from 'react';
import { createContext, useState, useEffect} from 'react';
import { dtc } from "../../declarations/dtc";
import Journal from './Components/Journal';
import {AuthClient} from "@dfinity/auth-client";
import LoginPage from './Components/LoginPage';
import { canisterId, createActor } from '../../declarations/dtc/index';

export const AppContext = createContext({
    authClient: {}, 
    setAuthClient: null,
    loginAttempted: undefined,
    setLoginAttempted: null,
    isAuthenticated: null,
    setIsAuthenticated: null,
    actor: undefined,
    setActor: null
});


const App = () => {
    const [actor, setActor] = useState(undefined);
    const [authClient, setAuthClient] = useState(undefined);
    const [isLoaded, setIsLoaded] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginAttempted, setLoginAttempted] = useState(false);

    // login function used when Authenticating the client (aka user)
    useEffect(() => {
        AuthClient.create().then(async (client) => {
            console.log("Client: ",client);
            setAuthClient(client);
            await client.isAuthenticated().then((result) => {
                setIsAuthenticated(result);
            });
            setIsLoaded(true);
        });
    }, [isLoaded])

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(() => {
        if(!authClient) return;

        const identity = authClient.getIdentity();
        const actor = createActor(canisterId, {
            agentOptions: {
                identity
            }
        });
        setActor(actor);

    }, [authClient]);

    return (
        <AppContext.Provider 
            value={{
                authClient, 
                setAuthClient, 
                setIsAuthenticated, 
                actor, 
                setActor, 
                setIsLoaded,
                loginAttempted, 
                setLoginAttempted, 
                isAuthenticated
            }}
        >

            {
                isLoaded &&
                    isAuthenticated ? 
                    <Journal/> : 
                    <LoginPage/> 
            }
            {
                !isLoaded && 
                    <h2> Load Screen </h2>
            }

        </AppContext.Provider>
    )
}

export default App;

//This is a test