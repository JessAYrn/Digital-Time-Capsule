import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Governance "../../NNS/Governance";


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
        #NeuronClaimFailed;
        #NoNeuronIdRetreived;
        #UnexpectedResponse : {response : Governance.Command_1};
    };

    public type UserStake = {icp : {e8s : Nat64}};

    public type UserStakesArray = [(Principal, UserStake)];

    public type UserStakesMap = HashMap.HashMap<Principal, UserStake>;

    public type TreasuryDataExport = {
        collateral : TreasuryCollateralArray;
        balance_icp: {e8s : Nat64};
        accountId_icp: [Nat8];
    };

    public type TreasuryCollateralArray = [(Text, Balances)];

    public type TreasuryCollateralMap = HashMap.HashMap<Text, Balances>;
}