import { dummyDataSets } from "../mappers/treasuryPageMapperFunctions";

export const treasuryTypes={
    SET_ENTIRE_TREASURY_REDUX_STATE:'SET_ENTIRE_TREASURY_REDUX_STATE',
    SET_TREASURY_DATA: "SET_TREASURY_DATA",
    SET_DATA_HAS_BEEN_LOADED: "SET_DATA_HAS_BEEN_LOADED",
    SET_IS_LOADING:"SET_IS_LOADING",
    SET_TREASURY_BALANCES_DATA: "SET_TREASURY_BALANCES_DATA"

}

export const treasuryPageInitialState={
    dataHasBeenLoaded: undefined,
    isLoading: false,
    treasuryData: {
        deposits: [],
        stakes: [],
        balance_icp: 0,
        accountId_icp: "" 
    },
    balancesData: dummyDataSets
}

const changeValue=(state=treasuryPageInitialState, action)=>{
    const{actionType,payload}=action;

    switch(actionType){
        case treasuryTypes.SET_ENTIRE_TREASURY_REDUX_STATE:
            state = payload;
            return {
                ...state
            }
        case treasuryTypes.SET_TREASURY_BALANCES_DATA:
            state.balancesData = payload;
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