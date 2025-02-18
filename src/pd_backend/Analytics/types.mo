import HashMap "mo:base/HashMap";

module{

    public type Balances = {
        icp: {e8s: Nat64};
        icp_staked: {e8s: Nat64};
        eth: {e8s: Nat64};
        btc: {e8s: Nat64};
    };

    public type BalancesArray = [(Text, Balances)];

    public type BalancesMap = HashMap.HashMap<Text, Balances>;
};