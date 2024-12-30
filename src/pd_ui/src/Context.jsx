import {createContext} from 'react';

export const UI_CONTEXTS = {
    JOURNAL: 'journal',
    ACCOUNT_PAGE: 'accountPage',
    WALLET: 'wallet',
    HOME_PAGE: 'homePage',
    TREASURY:'treasury',
    GROUPJOURNAL:'groupjournal'
};

const APP_CONTEXTS={
    journalState:{},
    journalDispatch: () => {},
    walletState:{},
    walletDispatch:()=>{},
    homePageDispatch:()=>{},
    homePageState:{},
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