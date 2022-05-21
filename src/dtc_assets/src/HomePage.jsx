import React, { createContext, useState, useEffect} from 'react';
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
    isAuthenticated: null,
    setIsAuthenticated: null,
    actor: undefined,
    setActor: null
});

const HomePage = () => {

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
                    <div className="container">
                        <div className="background center">
                            <NavBar
                                walletLink={true}
                                journalLink={true}
                                nftLink={false}
                                accountLink={true}
                                dashboardLink={false}
                                notificationIcon={false}
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