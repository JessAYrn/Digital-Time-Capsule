import { combineReducers } from "redux";
import journalReducer from "./journalReducer";

const rootReducer = combineReducers({
    journal: journalReducer
});

export default rootReducer;