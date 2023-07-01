// import changeValue from "./journalReducer"

import { NULL_STRING_CAPITALIZED } from "../Constants";


export const homePageTypes={
    SET_ENTIRE_DASHBOARD_REDUX_STATE:'SET_ENTIRE_DASHBOARD_REDUX_STATE',
    SET_CANISTER_DATA: "SET_CANISTER_DATA",
    SET_CANISTER_DATA_RELOAD_STATUS: "SET_CANISTER_DATA_RELOAD_STATUS"
}


export const homePageInitialState={
    shouldReload:true,
    canisterData: {
        profilesMetaData: [],
        journalCount: 0,
        backEndCyclesBurnRatePerDay: 1,
        backEndPrincipal: NULL_STRING_CAPITALIZED,
        frontEndPrincipal: NULL_STRING_CAPITALIZED,
        lastRecordedBackEndCyclesBalance: 1,
        currentCyclesBalance_backend: 1,
        currentCyclesBalance_frontend: 1,
        nftOwner: NULL_STRING_CAPITALIZED,
        isOwner: false,
        nftId: NULL_STRING_CAPITALIZED,
        supportMode: false,
        acceptingRequests: false,
        requestsForApproval: []
    },
}

const changeValue=(state=homePageInitialState, action)=>{
    const{actionType,payload,index, fileIndex, blockReload}=action;


    switch(actionType){
        case homePageTypes.SET_ENTIRE_DASHBOARD_REDUX_STATE:
            state = payload;
            return {
                ...state
            }
        case homePageTypes.SET_CANISTER_DATA:
                state.canisterData = payload;
                return {
                    ...state
            }
        case homePageTypes.SET_CANISTER_DATA_RELOAD_STATUS:
            state.shouldReload=payload;
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