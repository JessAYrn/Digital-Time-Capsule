// import {MODALS_TYPES,NULL_STRING_CAPITALIZED,WALLET_TABS,NULL_STRING_ALL_LOWERCASE} from '../Constants'

export const accountTypes={
    SET_ENTIRE_ACCOUNT_REDUX_STATE: "SET_ENTIRE_ACCOUNT_REDUX_STATE",
    CHANGE_USERNAME: "CHANGE_USERNAME",
    CHANGE_EMAIL: "CHANGE_EMAIL",
}

export const accountInitialState={
    metaData: {
        email: [],
        userName: []
    },
}

const changeValue = (state =accountInitialState, action) => {
    const {actionType, payload, index, fileIndex, blockReload } = action;

switch(actionType){
    case accountTypes.SET_ENTIRE_ACCOUNT_REDUX_STATE:
        state = payload;
        return {
            ...state
        }
       
    case accountTypes.CHANGE_EMAIL:
    state.bio = {
        ...state.bio,
        email: payload
    }
    state.metaData = {
        ...state.metaData,
        email: [payload]
    }
    return{
        ...state
    }
    case accountTypes.CHANGE_USERNAME:
            state.metaData = {
                ...state.metaData,
                userName: [payload]
            }
            return{
                ...state
            }
    }
}

export default changeValue;