export const notificationsTypes = {
    SET_ENTIRE_NOTIFICATIONS_REDUX_STATE:"SET_ENTIRE_NOTIFICATIONS_REDUX_STATE",
    SET_NOTIFICATIONS:"SET_NOTIFICATIONS",
    SET_DATA_HAS_BEEN_LOADED: "SET_DATA_HAS_BEEN_LOADED"
}

export const notificationsInitialState={
    dataHasBeenLoaded: undefined,
    notifications: []
};

const changeValue = (state = notificationsInitialState, action) => {
    const {actionType, payload } = action;
    switch(actionType){
        case notificationsTypes.SET_DATA_HAS_BEEN_LOADED:
        state.dataHasBeenLoaded = payload
        return {
            ...state
        }
        case notificationsTypes.SET_NOTIFICATIONS:
        state.notifications = payload
        return{
            ...state
        }
        case notificationsTypes.SET_ENTIRE_NOTIFICATIONS_REDUX_STATE:
            state = payload
            return{
                ...state
            }
        default:
        return {
            ...state
        }
    }
};

export default changeValue;