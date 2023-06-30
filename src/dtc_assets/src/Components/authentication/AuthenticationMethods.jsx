import { types } from "../../reducers/journalReducer";
import { MODALS_TYPES } from "../../Constants";

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

export const CreateUserJournal = async (actorState, journalDispatch, nameOfLoadFunction) => {
    try{
        let registrationResult = await actorState.backendActor.registerOwner();
    } catch(e) {
        console.log('could not be verified');
    }
    let result = await actorState.backendActor.create()
    if("err" in result){
        let payload = { show: true, which: MODALS_TYPES.notAuthorizedByOwner };
        journalDispatch({
            actionType: types.SET_MODAL_STATUS, 
            payload: payload
        });
    } else {
        const loadFunction = actorState.backendActor[nameOfLoadFunction];
        result = await loadFunction();
    }
    return result;
    
}
