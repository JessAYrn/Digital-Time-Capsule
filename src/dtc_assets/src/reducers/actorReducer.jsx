export const actorTypes={
    SET_BACKEND_ACTOR: "SET_BACKEND_ACTOR",
    SET_USER_CREDENTIALS: "SET_USER_CREDENTIALS" 
}


export const actorInitialState={
    userCredentials :{
        principal: null,
        agent: undefined
    },
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
    case actorTypes.SET_USER_CREDENTIALS:
        state.userCredentials = payload;
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