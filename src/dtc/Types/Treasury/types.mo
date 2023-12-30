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
        collateral : TreasuryCollateralArray;
        balance_icp: {e8s : Nat64};
        accountId_icp: [Nat8];
    };

    public type TreasuryCollateralArray = [(Text, Balances)];

    public type TreasuryCollateralMap = HashMap.HashMap<Text, Balances>;
}