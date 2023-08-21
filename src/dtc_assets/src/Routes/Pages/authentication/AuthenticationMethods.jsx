import { modalTypes } from "../../../reducers/modalReducer";
import { MODALS_TYPES } from "../../../functionsAndConstants/Constants";

export const CreateUserJournal = async (actorState, dispatch) => {
    try{
        let registrationResult = await actorState.backendActor.registerOwner();
    } catch(e) {
        console.log('could not be verified');
    }
    let result = await actorState.backendActor.create()
    if("err" in result){
        let payload = { show: true, which: MODALS_TYPES.notAuthorizedByOwner };
        dispatch({
            actionType: modalTypes.SET_MODAL_STATUS, 
            payload: payload
        });
    }
    return result;
    
}
