import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";


module{
    public type Balances = {
        icp: {e8s : Nat64};
        icp_staked: {e8s: Nat64};
        eth: {e8s: Nat64};
        btc: {e8s: Nat64};
    };

    public type SupportedCurrencies = {
        #Icp;
        #Icp_staked;
        #Eth;
        #Btc;
    };

    public type Error = {
        #InsufficientFunds;
    };

    public type TreasuryDataExport = {
        contributions : TreasuryContributorsArray;
        balance_icp: {e8s : Nat64};
        accountId_icp: [Nat8];
    };

    public type TreasuryContributorsArray = [(Text, Balances)];

    public type TreasuryContributorsMap = HashMap.HashMap<Text, Balances>;
}