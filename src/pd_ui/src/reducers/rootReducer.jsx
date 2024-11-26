import { combineReducers } from "redux";
import journalReducer from "./journalReducer";
import walletReducer from './walletReducer';
import homePageReducer from './homePageReducer';
import actorReducer from './actorReducer';
import notificationsReducer from './notificationsReducer';
import treasuryReducer  from "./treasuryReducer";

const rootReducer = combineReducers({
    journal: journalReducer,
    wallet: walletReducer,
    actor: actorReducer,
    homePage: homePageReducer,
    notifications: notificationsReducer,
    treasury: treasuryReducer
});


export default rootReducer;