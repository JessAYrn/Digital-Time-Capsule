import React, {useReducer, createContext, useEffect} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import AccountSection from '../Pages/AccountPage';
import { useLocation } from 'react-router-dom';
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadJournalData, loadCanisterData, loadWalletData, recoverState  } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import { DEFAULT_APP_CONTEXTS } from '../Constants';
import walletReducer,{ walletInitialState, walletTypes } from '../reducers/walletReducer';
import homePageReducer, { homePageInitialState, homePageTypes } from '../reducers/homePageReducer';
import actorReducer, { actorInitialState,actorTypes } from "../reducers/actorReducer";

export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const AccountPage = () => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [walletState, walletDispatch]=useReducer(walletReducer,walletInitialState);
    const [homePageState, homePageDispatch]=useReducer(homePageReducer,homePageInitialState);
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    const ReducerDispatches={
        walletDispatch,
        journalDispatch:dispatch,
        accountDispatch,
        homePageDispatch,
        actorDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes,
        homePageTypes,
        actorTypes
    }

    // gets state from previous route
    const location = useLocation();

    // dispatch state from previous route to redux store if that state exists
    recoverState(journalState, location, ReducerDispatches, ReducerTypes, connectionResult);

    useEffect(async () => {
        if(!actorState.backendActor) return;
        if(journalState.reloadStatuses.journalData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let journal = await actorState.backendActor.readJournal();
            if(!journal) return;
            if("err" in journal) journal = await CreateUserJournal(actorState, dispatch, 'readJournal');
            if("err" in journal) {
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            }
            loadJournalData(journal.ok, dispatch, types);
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        }
        if(journalState.reloadStatuses.canisterData){
            //Load canister data in background
            const canisterData = await actorState.backendActor.getCanisterData();
            loadCanisterData(canisterData, homePageDispatch, homePageTypes);
        }
        if(walletState.shouldReload){
            //Load wallet data in background
            // const walletDataFromApi = await journalState.actor.readWalletData();
            // await loadWalletData(walletDataFromApi, walletDispatch, walletTypes);

            const walletDataFromApi = await actorState.backendActor.readWalletData();
            await loadWalletData(walletDataFromApi, walletDispatch, walletTypes);
        }
    },[actorState.backendActor]);

    return (
        <AppContext.Provider 
            value={{
                journalState,
                dispatch,
                accountDispatch,
                accountState,
                walletDispatch,
                walletState,
                homePageState,
                homePageDispatch,
                actorState,
                actorDispatch
            }}
        >
            {
                journalState.isAuthenticated ? 
                    <AccountSection/> : 
                    <LoginPage
                        context={UI_CONTEXTS.ACCOUNT_PAGE}
                    /> 
            }
        </AppContext.Provider>
    )

};

export default AccountPage;