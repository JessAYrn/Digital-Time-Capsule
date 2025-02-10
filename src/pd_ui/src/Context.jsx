import {createContext} from 'react';

export const UI_CONTEXTS = {
    USER: 'user',
    ACCOUNT_PAGE: 'accountPage',
    WALLET: 'wallet',
    HOME_PAGE: 'homePage',
    TREASURY:'treasury',
    GROUPJOURNAL:'groupjournal'
};

const APP_CONTEXTS={
    userState:{},
    userDispatch: () => {},
    walletState:{},
    walletDispatch:()=>{},
    homePageState:{},
    homePageDispatch:()=>{},
    navigationAndApiState:{},
    navigationAndApiDispatch:()=>{},
    notificationsState:{},
    notificationsDispatch: () => {},
    treasuryState:{},
    treasuryDispatch: () => {},
    modalIsOpen: false,
    setModalIsOpen: () => {},
    modalIsLoading: false,
    setModalIsLoading: () => {},
    modalProps: {},
    setModalProps: () => {},
};

export const AppContext = createContext(APP_CONTEXTS);