import React, {useReducer, createContext, useEffect} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadJournalData, loadCanisterData, loadWalletData, recoverState  } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import TreasuryPage from '../Pages/TreasuryPage'




export const AppContext = createContext({
    journalState:{},
    dispatch: () => {}
});

const Treasury = () => {
    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
    //gets state from previous route
    const location = useLocation()

    recoverState(journalState, location, dispatch, types, connectionResult);


    
    
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
            loadJournalData(journal.ok, dispatch, types);
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
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await journalState.actor.readWalletData();
            await loadWalletData(walletDataFromApi, dispatch, types);
        }
    },[journalState.actor]);
  return (
    <AppContext.Provider
    value={{
        journalState,
        dispatch
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