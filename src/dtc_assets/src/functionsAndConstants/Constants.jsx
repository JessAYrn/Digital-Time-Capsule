export const dayInNanoSeconds = 86400000000000;

export const dayInMilliSeconds = 86400000;

export const monthInMilliSeconds = dayInMilliSeconds * 30;

export const monthInDays = 30;

export const e8sInOneICP = 100000000;

export const CHUNK_SIZE = 1024 * 1024;

export const NAV_LINKS = {
    wallet : '/wallet',
    journal : '/app',
    account: '/account',
    dashboard: '/',
    treasury:'/treasury',
    groupJournal:'/groupjournal'
};

export const DEVICE_TYPES = {
    mobile: "mobile",
    tablet: "tablet",
    desktop: "desktop"
};

export const MEGABYTES = 1000000;

export const MODALS_TYPES = {
    exitWithoutSubmit: 'exitWithoutSubmit',
    fileHasError: 'fileHasError',
    notifications: 'notifications',
    onSend:'onSend',
    onSubmit: 'onSubmit',
    notAuthorizedByOwner: "notAuthorizedByOwner",
    onRegisterNewOwner: "onRegisterNewOwner",
    requestApprovalRepsonse: "requestApprovalRepsonse",
    dateSelectedOutOfRange: 'dateSelectedOutOfRange'
}

export const MAX_NUMBER_OF_BYTES = 21000000;

export const MAX_DURATION_OF_VIDEO_IN_SECONDS = 61;

export const file1FileIndex = 0;

export const file2FileIndex = 1;

export const CANISTER_DATA_FIELDS = {
    frontEndPrincipal: "frontEndPrincipal",
    backEndPrincipal: "backEndPrincipal",
    backEndCyclesBurnRatePerDay: "backEndCyclesBurnRatePerDay",
    lastRecordedBackEndCyclesBalance: "lastRecordedBackEndCyclesBalance",
    nftOwner: "nftOwner",
    currentCyclesBalance_backend: "currentCyclesBalance_backend",
    currentCyclesBalance_frontend: "currentCyclesBalance_frontend",
    nftId: "nftId",
    requestsForApproval: "requestsForApproval",
    users: "users",
    journalCount: "journalCount"
}

export const PAGES = {
    JOURNAL_COVER: "JOURNAL_COVER",
    JOURNAL_PAGE: "JOURNAL_PAGE",
}

export const NULL_STRING_ALL_LOWERCASE = "null";
export const NULL_STRING_CAPITALIZED = "Null";
export const NULL_STRING_ALL_CAPS = "NULL";

export const PROVIDER_STATUS = {
    connected: 'connected',
    initializing: 'initializing',
    idle: 'idle'
}

export const JOURNAL_TABS={
    diaryTab:'diaryTab',
    notesTab:'notesTab'
}

export const WALLET_TABS={
    icpTab:'icp_tab',
    ethTab:'eth_tab',
    btcTab:'btc_tab',
    ckBtcTab:'ckBtc_tab'
}

export const DEFAULT_APP_CONTEXTS={
    journalState:{},
    journalDispatch: () => {},
    walletState:{},
    walletDispatch:()=>{},
    accountState:{},
    accountDispatch:()=>{},
    homePageDispatch:()=>{},
    homePageState:{},
    actorState:{},
    actorDispatch:()=>{}
}
export const MASTER_COPY_FRONTEND_CANISTER_ID = "fkkq7-siaaa-aaaap-qaaya-cai";

export const forbiddenFileTypes = [
    'application/pdf'
];
