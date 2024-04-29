export const actorTypes={
    SET_BACKEND_ACTOR: "SET_BACKEND_ACTOR",
    SET_USER_OBJECT: "SET_USER_OBJECT" 
}


export const actorInitialState={
    userObject :{
        principal: null,
        agent: undefined,
        provider: null
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
    case actorTypes.SET_USER_OBJECT:
        state.userObject = payload;
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