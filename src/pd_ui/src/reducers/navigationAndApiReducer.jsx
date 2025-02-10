export const navigationAndApiTypes={
    SET_BACKEND_ACTOR: "SET_BACKEND_ACTOR",
    SET_USER_CREDENTIALS: "SET_USER_CREDENTIALS",
    SET_LOCATION: "SET_LOCATION"
}

export const NAV_LINKS = {
    wallet : '/wallet',
    user : '/app',
    account: '/account',
    dashboard: '/',
    finances:'/finances',
    groupJournal:'/groupjournal'
};

export const TABS = {treasury: "treasury", wallet: "wallet"};


export const navigationAndApiInitialState={
    userCredentials :{
        principal: null,
        agent: undefined
    },
    backendActor: undefined,
    location:{
        route: NAV_LINKS.finances,
        tab: TABS.treasury
    }
}

const changeValue=(state = navigationAndApiInitialState, action)=>{
    const { actionType, payload } = action;

    switch(actionType){
    case navigationAndApiTypes.SET_BACKEND_ACTOR:
        state.backendActor = payload;
        return {
            ...state
        }
    case navigationAndApiTypes.SET_USER_CREDENTIALS:
        state.userCredentials = payload;
        return {
            ...state
        }
    case navigationAndApiTypes.SET_LOCATION:
        state.location = payload;
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