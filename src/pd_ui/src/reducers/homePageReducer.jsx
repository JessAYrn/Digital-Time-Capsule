// import changeValue from "./journalReducer"

import { NULL_STRING_CAPITALIZED } from "../functionsAndConstants/Constants";


export const homePageTypes={
    SET_CANISTER_DATA: "SET_CANISTER_DATA",
    SET_DATA_HAS_BEEN_LOADED: "SET_DATA_HAS_BEEN_LOADED",
    SET_IS_LOADING:"SET_IS_LOADING",
    SET_PROPOSALS_DATA: "SET_PROPOSALS_DATA",
    SET_DAO_PUBLIC_DATA: "SET_DAO_PUBLIC_DATA",
    SET_USER_NAMES: "SET_USER_NAMES"
}


export const homePageInitialState={
    dataHasBeenLoaded: undefined,
    isLoading: false,
    daoPublicData: {
        costToEnterDao: 0,
        daoFounder: "",
        daoIsPublic: null,
        currentCyclesBalance_backend: 1,
        currentCyclesBalance_frontend: 1,
        currentCyclesBalance_treasury: 1,
        currentCyclesBalance_manager: 1,
    },
    userNames: {},
    canisterData: {
        profilesMetaData: [],
        journalCount: 0,
        backEndCyclesBurnRatePerDay: 1,
        backEndPrincipal: NULL_STRING_CAPITALIZED,
        frontEndPrincipal: NULL_STRING_CAPITALIZED,
        treasuryCanisterPrincipal: NULL_STRING_CAPITALIZED,
        managerCanisterPrincipal: NULL_STRING_CAPITALIZED,
        releaseVersionLoaded: 0,
        releaseVersionInstalled: 0,
        lastRecordedBackEndCyclesBalance: 1,
        proposals: [],
        isAdmin: false,
        supportMode: false,
        acceptingRequests: false,
        requestsForAccess: []
    }
}

const changeValue=(state=homePageInitialState, action)=>{
    const{actionType,payload}=action;


    switch(actionType){
        case homePageTypes.SET_CANISTER_DATA:
                state.canisterData = payload;
                return {
                ...state
            }
        case homePageTypes.SET_USER_NAMES:
            state.userNames = payload;
            return {
            ...state
        }
        case homePageTypes.SET_DAO_PUBLIC_DATA:
            state.daoPublicData = payload;
            return {
            ...state
        }
        case homePageTypes.SET_PROPOSALS_DATA:
            state.canisterData.proposals = payload;
            return {
            ...state
        }
        case homePageTypes.SET_IS_LOADING:
            state.isLoading = payload;
            return {
                ...state
            }
        case homePageTypes.SET_DATA_HAS_BEEN_LOADED:
            state.dataHasBeenLoaded=payload;
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