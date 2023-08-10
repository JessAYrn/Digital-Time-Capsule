// import {MODALS_TYPES,NULL_STRING_CAPITALIZED,WALLET_TABS,NULL_STRING_ALL_LOWERCASE} from '../Constants'
import { MODALS_TYPES } from "../functionsAndConstants/Constants";

export const modalTypes={
    SET_ENTIRE_MODAL_REDUX_STATE: "SET_ENTIRE_MODAL_REDUX_STATE",
    SET_IS_LOADING:"SET_IS_LOADING",
    SET_MODAL_STATUS: "SET_MODAL_STATUS"
};

export const modalInitialState={
    isLoading: false,
    modalStatus: {
        show: false, 
        which: MODALS_TYPES.onSubmit
    }
}

const changeValue = (state =modalInitialState, action) => {
    const {actionType, payload } = action;

    switch(actionType){
        case modalTypes.SET_ENTIRE_MODAL_REDUX_STATE:
        state = payload;
        return {
            ...state
        }
        case modalTypes.SET_MODAL_STATUS:
        state.modalStatus = payload;
        return {
            ...state
        }
        case modalTypes.SET_IS_LOADING:
        state.isLoading = payload;
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