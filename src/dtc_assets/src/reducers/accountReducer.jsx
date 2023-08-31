// import {MODALS_TYPES,NULL_STRING_CAPITALIZED,WALLET_TABS,NULL_STRING_ALL_LOWERCASE} from '../Constants'

export const accountTypes={
    SET_ENTIRE_ACCOUNT_REDUX_STATE: "SET_ENTIRE_ACCOUNT_REDUX_STATE",
    CHANGE_USERNAME: "CHANGE_USERNAME",
    CHANGE_EMAIL: "CHANGE_EMAIL",
    SET_IS_LOADING:"SET_IS_LOADING",
    SET_DATA_HAS_BEEN_LOADED: "SET_DATA_HAS_BEEN_LOADED",
    SET_METADATA: "SET_METADATA"
};

export const accountInitialState={
    dataHasBeenLoaded: undefined,
    isLoading: false,
    metaData: {
        email: [],
        userName: []
    },
}

const changeValue = (state =accountInitialState, action) => {
    const {actionType, payload } = action;

    switch(actionType){
        case accountTypes.SET_ENTIRE_ACCOUNT_REDUX_STATE:
        state = payload;
        return {
            ...state
        }
        case accountTypes.SET_DATA_HAS_BEEN_LOADED:
        state.dataHasBeenLoaded = payload
        return {
            ...state
        }
        case accountTypes.CHANGE_EMAIL:
        state.metaData = {
            ...state.metaData,
            email: [payload]
        }
        return{
            ...state
        }
        case accountTypes.SET_METADATA:
        state.metaData = payload;
        return{
            ...state
        }
        case accountTypes.SET_IS_LOADING:
        state.isLoading = payload;
        return {
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
        default:
        return {
            ...state
        }
    }
    
}

export default changeValue;