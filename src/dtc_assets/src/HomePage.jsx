import React, { createContext, useReducer, useState, useEffect} from 'react';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from "./reducers/journalReducer";
import YouTube from 'react-youtube';
import {AuthClient} from "@dfinity/auth-client";
import LoginPage from './Components/LoginPage';
import { canisterId, createActor } from '../../declarations/dtc/index';
import { UI_CONTEXTS } from './Contexts';
import Analytics from './Components/Analytics';
import "./HomePage.scss";
import { NavBar } from './Components/navigation/NavBar';

const getYoutubeId = require('get-youtube-id');

export const AppContext = createContext({
    authClient: {}, 
    setAuthClient: null,
    loginAttempted: undefined,
    setLoginAttempted: null,
    journalState: null,
    dispatch: () => {},
    actor: undefined,
    setActor: null
});

const HomePage = () => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    //gets state from previous route
    let location = useLocation();
    //dispatch state from previous route to redux store if that state exists
    if(location.state){
        dispatch({
            actionType: types.SET_ENTIRE_REDUX_STATE,
            payload: location.state
        });
        //wipe previous location state to prevent infinite loop
        location.state = null;
    }

    const [actor, setActor] = useState(undefined);
    const [authClient, setAuthClient] = useState(undefined);
    const [isLoaded, setIsLoaded] = useState(true);
    const [loginAttempted, setLoginAttempted] = useState(false);

    // login function used when Authenticating the client (aka user)
    useEffect(() => {
        AuthClient.create().then(async (client) => {
            setAuthClient(client);
            await client.isAuthenticated().then((result) => {
                dispatch({
                    actionType: types.SET_IS_AUTHENTICATED,
                    payload: result
                });
            });
            setIsLoaded(true);
        });
    }, [isLoaded]);

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

    const mql = window.matchMedia('(max-width: 480px)');

    const opts= {
        height: 508,
        width: mql.matches ? 400 : 925,
        playerVars: {
            autoplay: 1
        }
    };

    const onready = () => {

    };


    return (
        <AppContext.Provider 
            value={{
                authClient, 
                setAuthClient, 
                actor, 
                journalState,
                dispatch,
                setActor, 
                setIsLoaded,
                loginAttempted, 
                setLoginAttempted, 
            }}
        >

            {           
                isLoaded &&
                    journalState.isAuthenticated ? 
                    <div className="container">
                        <div className="background center">
                            <NavBar
                                walletLink={true}
                                journalLink={true}
                                nftLink={true}
                                accountLink={true}
                                dashboardLink={false}
                                notificationIcon={false}
                                context={UI_CONTEXTS.HOME_PAGE}
                            />
                            <div class={'scrollable'}>
                                <Analytics/>
                                {/* <div className={'transparentDiv__homePage'}>
                                    <div className={'carouselDiv'}>
                                        <div className={'videoContainerDiv'}>
                                            <YouTube videoId={'hiB8OCPxF40'} opts={opts} onReady={onready}/>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </div> : 
                    <LoginPage
                        context={UI_CONTEXTS.HOME_PAGE}
                    /> 
            }
        </AppContext.Provider>
    );
};

export default HomePage;