import {StoicIdentity} from "ic-stoic-identity";
import { types, initialState } from "../../reducers/journalReducer";
import { MODALS_TYPES } from "../../Constants";

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
    try{
        let registrationResult = await journalState.actor.registerOwner();
    } catch(e) {
        console.log('could not be verified');
    }
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
