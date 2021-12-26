import React, {useReducer, createContext, useState, useEffect} from 'react';
import journalReducer, {initialState} from "./reducers/journalReducer";
import SubcriptionPage from './Components/SubcriptionPage';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import LoginPage from './Components/LoginPage';
import {AuthClient} from "@dfinity/auth-client";
import { canisterId, createActor } from '../../declarations/dtc/index';
import { UI_CONTEXTS } from './Contexts';

const stripePromise = loadStripe('pk_test_51K9W1hL2dowpsXoJ9detXdiT0DOrp7ILxHf37TejyOHGrrEXwcdl71swxOHU2ejtSBt6d7DJF1ESBn6MyqxhhcCt00a5WsmPLu');

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

const AccountPage = (props) => {

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

    console.log({
        journalState
    });

    return (
        <Elements stripe={stripePromise}>
            <AppContext.Provider 
                value={{
                    authClient, 
                    setIsLoaded,
                    loginAttempted, 
                    setLoginAttempted, 
                }}
            >
                {
                    isLoaded &&
                        isAuthenticated ? 
                        <SubcriptionPage
                            journalState={journalState}
                            dispatch={dispatch}
                        />: 
                        <LoginPage
                            context={UI_CONTEXTS.ACCOUNT_PAGE}
                        /> 
                }
                {
                    !isLoaded && 
                        <h2> Load Screen </h2>
                }
            </AppContext.Provider>
        </Elements>
    )

};

export default AccountPage;