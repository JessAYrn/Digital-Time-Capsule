import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";


module{
    public type TreasuryContributions = {
        icp: Nat64;
        icp_staked: Nat64;
        eth: Nat64;
        btc: Nat64;
    };

    public type TreasuryContributorsArray = [(Text, TreasuryContributions)];

    public type TreasuryContributorsMap = HashMap.HashMap<Text, TreasuryContributions>;
}