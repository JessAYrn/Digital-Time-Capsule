export const actorTypes={
    SET_BACKEND_ACTOR: "SET_BACKEND_ACTOR",
    SET_MANAGER_ACTOR: "SET_MANAGER_ACTOR",
}


export const actorInitialState={
    backendActor: undefined,
    managerActor: undefined,
}

const changeValue=(state = actorInitialState, action)=>{
    const { actionType, payload } = action;

    switch(actionType){
    case actorTypes.SET_BACKEND_ACTOR:
        state.backendActor = payload;
        return {
            ...state
        }
    case actorTypes.SET_MANAGER_ACTOR:
        state.managerActor = payload;
        return {
            ...state
        }
        default:
            return {
                ...state
            }
    }
}

export default changeValue;