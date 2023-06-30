import React, {useReducer, createContext, useEffect, useContext} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadJournalData, loadCanisterData, loadWalletData, recoverState  } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import GroupJournalPage from '../Pages/GroupJournalPage';
import { DEFAULT_APP_CONTEXTS } from '../Constants';
import walletReducer, { walletInitialState,walletTypes } from '../reducers/walletReducer';
import homePageReducer, { homePageInitialState,homePageTypes } from '../reducers/homePageReducer';
import accountReducer, { accountInitialState,accountTypes } from '../reducers/accountReducer';
import actorReducer, { actorInitialState,actorTypes } from '../reducers/actorReducer';





export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const GroupJournal = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [walletState, walletDispatch] = useReducer(walletReducer, walletInitialState);
    const [homePageState, homePageDispatch] =  useReducer(homePageReducer, homePageInitialState)
    const [accountState, accountDispatch] =  useReducer(accountReducer, accountInitialState)
    const [actorState, actorDispatch] = useReducer(actorReducer, actorInitialState);

    const ReducerDispatches={
        walletDispatch,
        journalDispatch,
        accountDispatch,
        actorDispatch,
        homePageDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes,
        actorTypes,
        homePageTypes
    }
    

    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
    //gets state from previous route
    const location = useLocation()

    recoverState(journalState, location, ReducerDispatches, ReducerTypes, connectionResult);


    
    
    useEffect( async () => {
        if(!actorState.backendActor) return;
        if(journalState.reloadStatuses.canisterData){
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let canisterData = await actorState.backendActor.getCanisterData();
            if(!canisterData) return;
            if("err" in canisterData) canisterData = await CreateUserJournal(actorState, journalDispatch, 'getCanisterData');
            if("err" in canisterData) {
                journalDispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            }

            canisterData = loadCanisterData(canisterData, homePageDispatch, homePageTypes);
            let requestsForApproval;
            if(canisterData.isOwner){
                requestsForApproval = await actorState.backendActor.getRequestingPrincipals();
                requestsForApproval = requestsForApproval.ok;
                let updatedCanisterData = {...canisterData, requestsForApproval};
                homePageDispatch({
                    actionType: homePageTypes.SET_CANISTER_DATA,
                    payload: updatedCanisterData
                });
            }
            journalDispatch({
                actionType: types.SET_CANISTER_DATA_RELOAD_STATUS,
                payload: false,
            });
            
            loadJournalData(journal.ok, journalDispatch, types);

            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });

        };
        if(journalState.reloadStatuses.journalData){
            //Load Journal Data in the background
            const journal = await actorState.backendActor.readJournal();
            loadJournalData(journal, journalDispatch, types);
        };
        if(walletState.shouldReload){
            //Load wallet data in background
            const walletDataFromApi = await actorState.backendActor.readWalletData();
            await loadWalletData(walletDataFromApi, walletDispatch, walletTypes);
        };


    }, [actorState.backendActor]);
  return (
    <AppContext.Provider
    value={{
        journalState,
        journalDispatch,
        walletState,
        walletDispatch,
        accountDispatch,
        accountState,
        homePageDispatch,
        homePageState,
        actorReducer,
        actorState,
    }}
    >
        {           
                journalState.isAuthenticated ? 
                <GroupJournalPage/> : 
                <LoginPage
                        context={UI_CONTEXTS.GROUPJOURNAL}
                /> 
        }

    </AppContext.Provider>
  )
}

export default GroupJournal;