import React, {useReducer, createContext, useEffect} from 'react';
import journalReducer, { types, initialState } from '../reducers/journalReducer';
import { useLocation } from 'react-router-dom';
import LoginPage from '../Components/authentication/LoginPage';
import { UI_CONTEXTS } from '../Contexts';
import { loadAllDataIntoReduxStores, recoverState  } from '../Components/loadingFunctions';
import { useConnect } from '@connect2ic/react';
import TreasuryPage from '../Pages/TreasuryPage'
import { DEFAULT_APP_CONTEXTS } from '../Constants';
import accountReducer , {accountTypes, accountInitialState} from '../reducers/accountReducer';
import walletReducer,{ walletInitialState, walletTypes } from '../reducers/walletReducer';
import actorReducer, { actorInitialState, actorTypes } from '../reducers/actorReducer';
import homePageReducer,{ homePageInitialState, homePageTypes } from '../reducers/homePageReducer';



export const AppContext = createContext(DEFAULT_APP_CONTEXTS);

const Treasury = () => {
    const [journalState, journalDispatch] = useReducer(journalReducer, initialState);
    const [accountState, accountDispatch] = useReducer(accountReducer, accountInitialState);
    const [walletState, walletDispatch]=useReducer(walletReducer,walletInitialState);
    const [actorState, actorDispatch]= useReducer(actorReducer, actorInitialState)
    const [homePageState, homePageDispatch]= useReducer(homePageReducer, homePageInitialState)

    window.onbeforeunload = window.history.replaceState(null, '');
    
    const connectionResult = useConnect({ onConnect: () => {}, onDisconnect: () => {} });
    
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

    const ReducerStates = {
        journalState,
        walletState,
        accountState,
        homePageState,
        actorState
    };
    
    //gets state from previous route
    const location = useLocation()
    recoverState( location, ReducerDispatches, ReducerTypes, connectionResult );
    
    
    useEffect( async () => {
        if(!actorState.backendActor) return;
        homePageDispatch( { actionType: homePageTypes.SET_IS_LOADING, payload: true } );
        await loadAllDataIntoReduxStores(ReducerStates, ReducerDispatches, ReducerTypes);
        homePageDispatch( { actionType: homePageTypes.SET_IS_LOADING, payload: false } );
    }, [actorState.backendActor]);
  return (
    <AppContext.Provider
    value={{
        journalState,
        journalDispatch,
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