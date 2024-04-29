import {createContext} from 'react';

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