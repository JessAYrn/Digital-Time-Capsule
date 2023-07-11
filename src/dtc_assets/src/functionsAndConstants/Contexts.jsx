export const UI_CONTEXTS = {
    JOURNAL: 'journal',
    ACCOUNT_PAGE: 'accountPage',
    WALLET: 'wallet',
    HOME_PAGE: 'homePage',
    TREASURY:'treasury',
    GROUPJOURNAL:'groupjournal'
};

export const retrieveContext = (contexts, context) => {
    const {JournalContext, HomePageContext, WalletContext, AccountContext, TreasuryContext, GroupJournalContext} = contexts;
    let AppContext;
    if(context === UI_CONTEXTS.JOURNAL) AppContext = JournalContext;
    else if(context === UI_CONTEXTS.HOME_PAGE) AppContext = HomePageContext;
    else if(context === UI_CONTEXTS.WALLET) AppContext = WalletContext
    else if(context === UI_CONTEXTS.ACCOUNT_PAGE) AppContext = AccountContext;
    else if(context === UI_CONTEXTS.TREASURY) AppContext = TreasuryContext;
    else if(context === UI_CONTEXTS.GROUPJOURNAL) AppContext = GroupJournalContext
    return AppContext;
}