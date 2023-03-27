import React, { createContext, useReducer, useState, useEffect, useMemo} from 'react';
import LoginPage from '../Components/authentication/LoginPage';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import { UI_CONTEXTS } from '../Contexts';
import WalletPage from '../Pages/WalletPage';
import { testTx } from '../testData/Transactions';
import { CreateUserJournal } from '../Components/authentication/AuthenticationMethods';
import { loadJournalData, loadWalletData, loadCanisterData, recoverState } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import CkBtcPage from '../Pages/CkBtcPage';
import EthPage from '../Pages/EthPage';
import BtcPage from '../Pages/BtcPage';

export const AppContext = createContext({
    journalState:{},
    dispatch: () => {}
});


const WalletApp = () => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });

    // gets state from previous route
    const location = useLocation();

    // dispatch state from previous route to redux store if that state exists
    recoverState(journalState, location, dispatch, types, connectionResult)

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    
    const WalletTabComponent=useMemo(()=>{
        if(journalState.walletPageTab==='icp_tab'){
            return WalletPage;
        }else if(journalState.walletPageTab==='btc_tab'){
            return BtcPage;
        }
        else if(journalState.walletPageTab==='eth_tab'){
            return EthPage;
        }
        else if(journalState.walletPageTab==='ckBtc_tab'){
            console.log('CKBTC')
            return CkBtcPage;
        }
    },[journalState.walletPageTab])

    console.log(WalletTabComponent);
    //Loading Time Capsule Data
    useEffect(async () => {
        if(!journalState.actor){
            return;
        }
        if(journalState.reloadStatuses.walletData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let walletDataFromApi = await journalState.actor.readWalletData()
            if(!walletDataFromApi) return;
            if("err" in walletDataFromApi) walletDataFromApi = await CreateUserJournal(journalState, dispatch, 'readWalletData');
            if("err" in walletDataFromApi) {
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
                return;
            };
            await loadWalletData(walletDataFromApi, dispatch, types);
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        }; 
        if(journalState.reloadStatuses.canisterData){
            //Load canister data in background
            const canisterData = await journalState.actor.getCanisterData();
            loadCanisterData(canisterData, dispatch, types);
        }
        if(journalState.reloadStatuses.journalData){
            //Load Journal Data in the background
            const journal = await journalState.actor.readJournal();
            loadJournalData(journal, dispatch, types);
        };
        
    },[journalState.actor]);

    return(
        <AppContext.Provider 
                value={{
                    journalState,
                    dispatch
                }}
            >
                {
                    journalState.isAuthenticated ?
                        <WalletTabComponent/> : 
                        <LoginPage
                            context={UI_CONTEXTS.WALLET}
                        /> 
                }
            </AppContext.Provider>
    );

}

export default WalletApp;