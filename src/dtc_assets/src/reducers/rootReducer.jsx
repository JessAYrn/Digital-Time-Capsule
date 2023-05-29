import { combineReducers } from "redux";
import journalReducer from "./journalReducer";
import walletReducer from './walletReducer';



const rootReducer = combineReducers({
    journal: journalReducer,
    wallet: walletReducer
});


export default rootReducer;