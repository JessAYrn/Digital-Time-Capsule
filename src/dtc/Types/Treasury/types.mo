import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
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

    public type Memo = Nat;

    public type NeuronId = Nat64;

    public type NeuronIdAsNat = Nat;

    public type NeuronInfoArray = [(NeuronIdAsNat, Governance.Neuron)];

    public type NeuronInfoMap = HashMap.HashMap<NeuronIdAsNat, Governance.Neuron>;

    public type MemoToNeuronIdMap = HashMap.HashMap<Memo, NeuronIdAsNat>;

    public type MemoToNeuronIdArray = [(Memo, NeuronIdAsNat)];

    public type RequestId = Blob;

    public type Expiry = Nat64;
    
    public type CachedRequest = {
        requestId: RequestId;
        expiry: Expiry;
        memoUsed: ?Nat64;
        neuronId: ?NeuronId;
        expectedResponseType: ExpectedRequestResponses;
    };

    public type ExpectedRequestResponses = {
        #CreateOrIncreaseNeuronResponse;
        #GetFullNeuronResponse;
        #Spawn;
        #Split;
        #Follow;
        #ClaimOrRefresh;
        #Configure;
        #RegisterVote;
        #Merge;
        #DisburseToNeuron;
        #MakeProposal;
        #StakeMaturity;
        #MergeMaturity;
        #Disburse;
    };

    public type RequestResponses = {
        #CreateOrIncreaseNeuronResponse : Governance.ClaimOrRefreshResponse;
        #GetFullNeuronResponse : Governance.Result_2;
        #Error : Governance.GovernanceError;
        #Spawn : Governance.SpawnResponse;
        #Split : Governance.SpawnResponse;
        #Follow : {};
        #ClaimOrRefresh : Governance.ClaimOrRefreshResponse;
        #Configure : {};
        #RegisterVote : {};
        #Merge : Governance.MergeResponse;
        #DisburseToNeuron : Governance.SpawnResponse;
        #MakeProposal : Governance.MakeProposalResponse;
        #StakeMaturity : Governance.StakeMaturityResponse;
        #MergeMaturity : Governance.MergeMaturityResponse;
        #Disburse : Governance.DisburseResponse;
    };

}