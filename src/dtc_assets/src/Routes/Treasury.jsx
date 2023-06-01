import React, {useReducer, createContext, useEffect, useContext} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadJournalData, loadCanisterData, loadWalletData, recoverState  } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import TreasuryPage from '../Pages/TreasuryPage'
import { DEFAULT_APP_CONTEXTS } from '../Constants';
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import walletReducer,{ walletInitialState, walletTypes } from '../reducers/walletReducer';
import actorReducer, { actorInitialState, actorTypes } from '../reducers/actorReducer';
import homePageReducer,{ homePageInitialState, homePageTypes } from '../reducers/homePageReducer';



export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const Treasury = () => {
    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [walletState, walletDispatch]=useReducer(walletReducer,walletInitialState);
    const [actorState, actorDispatch]= useReducer(actorReducer, actorInitialState)
    const [homePageState, homePageDispatch]= useReducer(homePageReducer, homePageInitialState)



    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
    const ReducerDispatches={
        walletDispatch:walletDispatch,
        journalDispatch:dispatch,
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
    
    //gets state from previous route
    const location = useLocation()

    recoverState(journalState, location, ReducerDispatches, ReducerTypes, connectionResult);
    
    
    useEffect( async () => {
        if(!actorState.backendActor) return;
        if(journalState.reloadStatuses.canisterData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let canisterData = await actorState.backendActor.getCanisterData();
            if(!canisterData) return;
            if("err" in canisterData) canisterData = await CreateUserJournal(actorState, dispatch, 'getCanisterData');
            if("err" in canisterData) {
                dispatch({
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
            dispatch({
                actionType: types.SET_CANISTER_DATA_RELOAD_STATUS,
                payload: false,
            });
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        };
        if(journalState.reloadStatuses.journalData){
            //Load Journal Data in the background
            const journal = await actorState.backendActor.readJournal();
            loadJournalData(journal, dispatch, types);
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
        dispatch,
        accountState,
        accountDispatch,
        walletDispatch,
        walletState,
        homePageDispatch,
        homePageState,
        actorDispatch,
        actorState
    }}
    >
        {           
                journalState.isAuthenticated ? 
                <TreasuryPage/>    
                : 
                <LoginPage
                        context={UI_CONTEXTS.TREASURY}
                /> 
        }

    </AppContext.Provider>
  )
}

export default Treasury;