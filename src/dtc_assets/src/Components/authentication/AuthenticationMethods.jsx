import { AuthClient } from "@dfinity/auth-client";
import { createActor, canisterId } from "../../../../declarations/dtc/index";
import {StoicIdentity} from "ic-stoic-identity";
import { types, initialState } from "../../reducers/journalReducer";

export const AuthenticateClient = async (journalState, dispatch, actionTypes) => { 
    let stoicIsConnected;
    await StoicIdentity.load().then(async identity => {
        stoicIsConnected = !!identity;
        dispatch({
            actionType: types.SET_STOIC_IDENTITY,
            payload: identity
        });
    }); 
    if(stoicIsConnected){
        dispatch({
            actionType: actionTypes.SET_IS_AUTHENTICATED,
            payload: true
        });
    } else {
        const client = await AuthClient.create();
        dispatch({
            actionType: actionTypes.SET_AUTH_CLIENT,
            payload: client
        });
        const isAuthenticated = await client.isAuthenticated();
        dispatch({
            actionType: actionTypes.SET_IS_AUTHENTICATED,
            payload: isAuthenticated
        });
    }
    dispatch({
        actionType: actionTypes.SET_IS_LOGGING_IN,
        payload: false
    });
};

export const CreateActor = async (journalState, dispatch, actionTypes) => {
    if(!journalState.authClient && !journalState.stoicIdentity) return;

    let identity;
    if(journalState.stoicIdentity) identity = journalState.stoicIdentity;
    else identity = journalState.authClient.getIdentity();
    const actor_ = createActor(canisterId, {
        agentOptions: {
            identity
        }
    })
    dispatch({
        actionType: actionTypes.SET_ACTOR,
        payload: actor_
    });
}

export const logout = async (journalState, dispatch) => {
    let identity = await StoicIdentity.load();
    if(identity !== false) StoicIdentity.disconnect();
    else await journalState.authClient.logout();
    dispatch({
        actionType: types.SET_ENTIRE_REDUX_STATE,
        payload: initialState
    });
    dispatch({
        actionType: types.SET_IS_LOGGING_IN,
        payload: true
    });
}