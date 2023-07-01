import { combineReducers } from "redux";
import journalReducer from "./journalReducer";
import walletReducer from './walletReducer';
import homePageReducer from './homePageReducer';
import actorReducer from './actorReducer';
import accountReducer from './accountReducer';

const rootReducer = combineReducers({
    journal: journalReducer,
    wallet: walletReducer,
    actor: actorReducer,
    account: accountReducer,
    homePage: homePageReducer,
});


export default rootReducer;