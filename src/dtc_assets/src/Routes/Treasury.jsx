import React, {useReducer, createContext, useEffect} from 'react';
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




export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const Treasury = () => {
    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [walletState, walletDispatch]=useReducer(walletReducer,walletInitialState);




    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
    const ReducerDispatches={
        walletDispatch:walletDispatch,
        journalDispatch:dispatch,
        accountDispatch
    }

    const ReducerTypes={
        journalTypes:types,
        walletTypes,
        accountTypes
    }
    
    //gets state from previous route
    const location = useLocation()

    recoverState(journalState, location, ReducerDispatches, ReducerTypes, connectionResult);
    
    
    useEffect(async () => {
        if(!journalState.actor) return;
        if(journalState.reloadStatuses.journalData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let journal = await journalState.actor.readJournal();
            if(!journal) return;
            if("err" in journal) journal = await CreateUserJournal(journalState, dispatch, 'readJournal');
            if("err" in journal) {
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            }
            loadJournalData(journal, dispatch, types);
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        }
        if(journalState.reloadStatuses.canisterData){
            //Load canister data in background
            const canisterData = await journalState.actor.getCanisterData();
            loadCanisterData(canisterData, dispatch, types);
        }
        if(walletState.shouldReload){
            //Load wallet data in background
            const walletDataFromApi = await journalState.actor.readWalletData();
            await loadWalletData(walletDataFromApi, walletDispatch, walletTypes);
        }
    },[journalState.actor]);
  return (
    <AppContext.Provider
    value={{
        journalState,
        dispatch,
        accountState,
        accountDispatch,
        walletDispatch,
        walletState
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