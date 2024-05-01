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
    accountState:{},
    accountDispatch:()=>{},
    homePageDispatch:()=>{},
    homePageState:{},
    actorState:{},
    actorDispatch:()=>{},
    notificationsState:{},
    notificationsDispatch: () => {},
    treasuryState:{},
    treasuryDispatch: () => {},
    setRoute: () => {},
    setModalIsOpen: () => {},
    setIsLoadingModal: () => {},
    setModalProps: () => {},
};

export const AppContext = createContext(APP_CONTEXTS);