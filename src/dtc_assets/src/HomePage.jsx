import React, { createContext, useReducer, useEffect} from 'react';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from "./reducers/journalReducer";
import LoginPage from './Components/authentication/LoginPage';
import { UI_CONTEXTS } from './Contexts';
import Analytics from './Components/Analytics';
import "./HomePage.scss";
import { NavBar } from './Components/navigation/NavBar';
import { AuthenticateClient, CreateActor } from './Components/authentication/AuthenticationMethods';
import { TriggerAuththenticateClientFunction } from './Components/authentication/AuthenticationMethods';
import { handleErrorOnFirstLoad } from './Components/loadingFunctions';
import { mapBackendCanisterDataToFrontEndObj } from './mappers/dashboardMapperFunctions';

export const AppContext = createContext({
    journalState: null,
    dispatch: () => {}
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

    // login function used when Authenticating the client (aka user)
    useEffect(() => {
        const authenticate = async () => {
            await AuthenticateClient(journalState, dispatch, types)
        };
        authenticate();
    }, [journalState.authenticateFunctionCallCount]);

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(() => {
        const constructActor = async () => {
            await CreateActor(journalState, dispatch, types)
        };
        constructActor();
    }, [journalState.createActorFunctionCallCount]);

    useEffect( async () => {
        if(!journalState.actor){
            return;
        }
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        })
        let profilesTrieSize = await handleErrorOnFirstLoad(
            journalState.actor.getProfilesSize, 
            TriggerAuththenticateClientFunction, 
            { journalState, dispatch, types }
        );
        if(!profilesTrieSize && parseInt(profilesTrieSize) !== 0) return;
        let canisterData = await journalState.actor.getCanisterData();
        canisterData = mapBackendCanisterDataToFrontEndObj(canisterData);
        dispatch({
            actionType: types.SET_CANISTER_DATA,
            payload: canisterData
        });

        dispatch({
            actionType: types.SET_JOURNAL_COUNT,
            payload: parseInt(profilesTrieSize)
        })
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        })

    }, [journalState.actor]);

    return (
        <AppContext.Provider 
            value={{
                journalState,
                dispatch
            }}
        >

            {           
                journalState.isAuthenticated ? 
                <div className="container">
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