import { combineReducers } from "redux";
import journalReducer from "./journalReducer";
import walletReducer from './walletReducer';
import homePageReducer from './homePageReducer';
import navigationAndApiReducer from './navigationAndApiReducer';
import notificationsReducer from './notificationsReducer';
import treasuryReducer  from "./treasuryReducer";

const rootReducer = combineReducers({
    journal: journalReducer,
    wallet: walletReducer,
    navigationAndApi: navigationAndApiReducer,
    homePage: homePageReducer,
    notifications: notificationsReducer,
    treasury: treasuryReducer
});


export default rootReducer;