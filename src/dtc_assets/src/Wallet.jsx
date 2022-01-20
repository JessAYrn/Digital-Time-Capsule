import React, {useReducer, createContext, useState, useEffect} from 'react';
import journalReducer, {initialState} from "./reducers/journalReducer";
import LoginPage from './Components/LoginPage';
import {AuthClient} from "@dfinity/auth-client";
import { canisterId, createActor } from '../../declarations/dtc/index';
import { UI_CONTEXTS } from './Contexts';
import WalletPage from './Components/WalletPage';

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


const WalletApp = () => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [actor, setActor] = useState(undefined);
    const [authClient, setAuthClient] = useState(undefined);
    const [isLoaded, setIsLoaded] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginAttempted, setLoginAttempted] = useState(false);

    // login function used when Authenticating the client (aka user)
    useEffect(() => {
        AuthClient.create().then(async (client) => {
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





    return(
        <AppContext.Provider 
                value={{
                    authClient, 
                    setIsLoaded,
                    loginAttempted, 
                    setLoginAttempted, 
                    actor
                }}
            >
                {
                    isLoaded &&
                        isAuthenticated ? 
                        <WalletPage/> : 
                        <LoginPage
                            context={UI_CONTEXTS.WALLET}
                        /> 
                }
                {
                    !isLoaded && 
                        <h2> Load Screen </h2>
                }
            </AppContext.Provider>
    );

}

export default WalletApp;