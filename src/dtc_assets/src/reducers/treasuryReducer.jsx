export const treasuryTypes={
    SET_ENTIRE_TREASURY_REDUX_STATE:'SET_ENTIRE_TREASURY_REDUX_STATE',
    SET_TREASURY_DATA: "SET_TREASURY_DATA",
    SET_DATA_HAS_BEEN_LOADED: "SET_DATA_HAS_BEEN_LOADED",
    SET_IS_LOADING:"SET_IS_LOADING",

}

export const treasuryPageInitialState={
    dataHasBeenLoaded: undefined,
    isLoading: false,
    treasuryData: {
        contributions: [],
        balance_icp: 0,
        accountId_icp: "" 
    }
}

const changeValue=(state=treasuryPageInitialState, action)=>{
    const{actionType,payload}=action;

    switch(actionType){
        case treasuryTypes.SET_ENTIRE_TREASURY_REDUX_STATE:
            state = payload;
            return {
                ...state
            }
        case treasuryTypes.SET_TREASURY_DATA:
                state.treasuryData = payload;
                return {
                ...state
            }
        case treasuryTypes.SET_IS_LOADING:
            state.isLoading = payload;
            return {
                ...state
            }
        case treasuryTypes.SET_DATA_HAS_BEEN_LOADED:
            state.dataHasBeenLoaded=payload;
            return {
                ...state
            }
        default:
            return {
                
            }
    }
}

export default changeValue;