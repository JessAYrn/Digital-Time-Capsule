import * as React from 'react';
import { createContext, useState, useEffect, useReducer} from 'react';
import { useLocation } from 'react-router-dom';
import Journal from './Components/Journal';
import LoginPage from './Components/authentication/LoginPage';
import LoadScreen from './Components/LoadScreen';
import { UI_CONTEXTS } from './Contexts';
import journalReducer, {initialState, types} from './reducers/journalReducer';
import { TEST_DATA_FOR_NOTIFICATIONS } from './testData/notificationsTestData';
import { AuthenticateClient, CreateActor } from './Components/authentication/AuthenticationMethods';
import { loadJournalData, loadNftData, loadWalletData } from './Components/loadingFunctions';

export const AppContext = createContext({
    journalState:{},
    dispatch: () => {}
});

const App = () => {
    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [submissionsMade, setSubmissionsMade] = useState(0);

    // gets state from previous route
    const location = useLocation();
    // dispatch state from previous route to redux store if that state exists
    if(location.state){
        dispatch({
            actionType: types.SET_ENTIRE_REDUX_STATE,
            payload: location.state
        });
        //wipe previous location state to prevent infinite loop
        location.state = null;
    };

    // login function used when Authenticating the client (aka user)
    useEffect(() => {
        const authenticate = async () => {
            await AuthenticateClient(journalState, dispatch, types)
        };
        authenticate();
    }, [journalState.loginAttempts]);

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(() => {
        const constructActor = async () => {
            await CreateActor(journalState, dispatch, types)
        };
        constructActor();
    }, [journalState.isAuthenticated]);

    // clears useLocation().state upon page refresh so that when the user refreshes the page,
    // changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    useEffect(async () => {
        if(!journalState.isAuthenticated || !journalState.actor) return;
        if(journalState.reloadStatuses.journalData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            const journal = await journalState.actor.readJournal();
            if("err" in journal){
                journalState.actor.create().then((result) => {
                    dispatch({
                        actionType: types.SET_IS_LOADING,
                        payload: false
                    });
                });
            } else {
                loadJournalData(journal, dispatch, types);
            }
        }
        if(journalState.reloadStatuses.nftData){
            const nftCollection = await journalState.actor.getUserNFTsInfo();
            loadNftData(nftCollection, dispatch, types);
        }
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await journalState.actor.readWalletData();
            await loadWalletData(walletDataFromApi, dispatch, types);
        }
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    },[journalState.actor]);

    return (
        <AppContext.Provider 
            value={{
                journalState,
                dispatch,
                submissionsMade,
                setSubmissionsMade
            }}
        >

            {
                journalState.isAuthenticated ? 
                journalState.isLoading ? 
                    <LoadScreen/> :
                        <Journal/> : 
                            <LoginPage
                                context={UI_CONTEXTS.JOURNAL}
                            /> 
            }

        </AppContext.Provider>
    )
}

export default App;