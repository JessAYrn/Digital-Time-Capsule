export const dayInNanoSeconds = 86400000000000;

export const dayInMilliSeconds = 86400000;

export const monthInMilliSeconds = dayInMilliSeconds * 30;

export const monthInDays = 30;

export const e8sInOneICP = 100000000;

export const CHUNK_SIZE = 1024 * 1024;

export const DEVICE_TYPES = {
    mobile: "mobile",
    tablet: "tablet",
    desktop: "desktop"
};

export const MEGABYTES = 1000000;

export const MODALS_TYPES = {
    onSend:'onSend',
    onSubmit: 'onSubmit',
    onRegisterNewOwner: "onRegisterNewOwner",
    requestApprovalRepsonse: "requestApprovalRepsonse",
    quicktimeVideoDetected: 'quicktimeVideoDetected',
    unsupportedFileType: 'unsupportedFileType',
    error: 'error'
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
    RequestsForAccess: "RequestsForAccess",
    users: "users",
    usersCount: "usersCount",
    profilesMetaData: "profilesMetaData",
    treasuryCanisterPrincipal: "treasuryCanisterPrincipal",
    managerCanisterPrincipal: "managerCanisterPrincipal",
    releaseVersionLoaded: "releaseVersionLoaded",
    releaseVersionInstalled: "releaseVersionInstalled",
    founder: "founder",
    proposals: "proposals",
    isAdmin: "isAdmin",
    supportMode: "supportMode",
    acceptingRequests: "acceptingRequests",
    daoPublicData: "daoPublicData",
    costToEnterDao: "costToEnterDao",
    daoIsPublic: "daoIsPublic"
};

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

export const USER_TABS={
    diaryTab:'diaryTab',
    notesTab:'notesTab'
}

export const WALLET_TABS={
    icpTab:'icp_tab',
    ethTab:'eth_tab',
    btcTab:'btc_tab',
    ckBtcTab:'ckBtc_tab'
}

export const MASTER_COPY_FRONTEND_CANISTER_ID = "fkkq7-siaaa-aaaap-qaaya-cai";

export const forbiddenFileTypes = [
    'application/pdf'
];

export const BUTTON_TYPES = {
    iconWithText: 'iconWithText',
    icon: 'icon',
    text: 'text',
    loading: 'loading'
};

export const INPUT_BOX_FORMATS = {
    numberFormat : "numberFormat",
    noFormat : "noFormat"
};

export const CHART_TYPES = {
    line: "LINE",
    bar: "BAR",
    pie: "PIE"
}; 

export const GRAPH_DATA_SET_TIMEFRAMES = {
    week: "1W",
    month: "1M",
    year: "1Y",
    allTime: "all",
};

export const GRAPH_DISPLAY_LABELS = {
    icp: "icp",
    icp_staked: "icp_staked",
    btc: "btc",
    eth: "eth",
    xdrs: "xdrs",
    stake: "icp_staked",
    stake_e8s: "stake_e8s",
    votingPower: "voting_power",
    voting_power: "voting_power",

};

export const FUNDING_CAMPAIGN_ASSET_TYPES = {
    icp: "icp",
    icp_staked: "icp_staked",
    ck_btc: "ck_btc",
    ck_eth: "ck_eth",
    ck_usdc: "ck_usdc",
    ck_usdt: "ck_usdt",
};

export const PERMITTED_USERNAME_CHARACTERS = [
    'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
    'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
    '0','1','2','3','4','5','6','7','8','9',
    '_','-'
];
