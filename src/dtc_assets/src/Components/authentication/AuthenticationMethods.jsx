import { AuthClient } from "@dfinity/auth-client";
import { createActor, canisterId } from "../../../../declarations/dtc/index";
import {StoicIdentity} from "ic-stoic-identity";
import { types, initialState } from "../../reducers/journalReducer";
import { MODALS_TYPES } from "../../Constants";

export const AuthenticateClient = async (journalState, dispatch, actionTypes) => { 
    let identity;
    await StoicIdentity.load().then(identity_ => {
        if (identity_ !== false) identity = identity_;
    });
    let isAuthenticated = !!identity
    dispatch({
        actionType: types.SET_STOIC_IDENTITY,
        payload: identity
    });
    if(isAuthenticated){
        dispatch({
            actionType: actionTypes.SET_IS_AUTHENTICATED,
            payload: isAuthenticated
        });
    } else {
        const client = await AuthClient.create();
        dispatch({
            actionType: actionTypes.SET_AUTH_CLIENT,
            payload: client
        });
        isAuthenticated = await client.isAuthenticated();
        dispatch({
            actionType: actionTypes.SET_IS_AUTHENTICATED,
            payload: isAuthenticated
        });
    };
    if(isAuthenticated) TriggerCreateActorFunction(journalState, dispatch, types);
};

export const CreateActor = async (journalState, dispatch, actionTypes) => {
    if(!journalState.authClient && !journalState.stoicIdentity) return;

    let identity;
    if(journalState.stoicIdentity) {
        identity = journalState.stoicIdentity;
    }
    else {
        identity = journalState.authClient.getIdentity();
    }
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

export const TriggerAuththenticateClientFunction = (journalState, dispatch, types) => {
    dispatch({
        actionType: types.SET_AUTHENTICATE_FUNCTION_CALL_COUNT,
        payload: journalState.authenticateFunctionCallCount + 1
    });
};

export const TriggerCreateActorFunction = (journalState, dispatch, types) => {
    dispatch({
        actionType: types.SET_CREATE_ACTOR_FUNCTION_CALL_COUNT,
        payload: journalState.createActorFunctionCallCount + 1
    });
}

export const CreateUserJournal = async (journalState, dispatch, nameOfLoadFunction) => {
    let registrationResult = await journalState.actor.registerOwner();
    let result = await journalState.actor.create()
    if("err" in result){
        let payload = { show: true, which: MODALS_TYPES.notAuthorizedByOwner };
        dispatch({
            actionType: types.SET_MODAL_STATUS, 
            payload: payload
        });
    } else {
        const loadFunction = journalState.actor[nameOfLoadFunction];
        result = await loadFunction();
    }
    return result;
    
}
