import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";


module{
    public type Contributions = {
        icp: Nat64;
        icp_staked: Nat64;
        eth: Nat64;
        btc: Nat64;
    };

    public type ContributorsArray = [(Principal, Contributions)];

    public type ContributorsMap = HashMap.HashMap<Principal, Contributions>;
}