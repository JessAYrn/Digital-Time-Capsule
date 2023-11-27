export const actorTypes={
    SET_BACKEND_ACTOR: "SET_BACKEND_ACTOR"
}


export const actorInitialState={
    backendActor: undefined,
}

const changeValue=(state = actorInitialState, action)=>{
    const { actionType, payload } = action;

    switch(actionType){
    case actorTypes.SET_BACKEND_ACTOR:
        state.backendActor = payload;
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