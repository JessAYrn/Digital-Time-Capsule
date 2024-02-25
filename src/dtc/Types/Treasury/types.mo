import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
import Governance "../../NNS/Governance";


module{

    public type Deposits = {
        icp: {total : {e8s : Nat64}; collateral : {e8s : Nat64}};
        icp_staked: {total : {e8s : Nat64}; collateral : {e8s : Nat64}};
        eth: {total : {e8s : Nat64}; collateral : {e8s : Nat64}};
        btc: {total : {e8s : Nat64}; collateral : {e8s : Nat64}};
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

    public type NeuronStakeInfo = {
        stake_e8s : Nat64;
        voting_power : Nat64;
    };

    public type UserStake = {icp : [(NeuronIdAsText, NeuronStakeInfo)]};

    public type UserStakesArray = [(Principal, UserStake)];

    public type UserStakesMap = HashMap.HashMap<Principal, UserStake>;

    public type TreasuryDataExport = {
        stakes : UserStakesArray;
        deposits : TreasuryDepositsArray;
        balance_icp: {e8s : Nat64};
        accountId_icp: [Nat8];
    };

    public type TreasuryDepositsArray = [(Text, Deposits)];

    public type TreasuryDepositsMap = HashMap.HashMap<Text, Deposits>;

    public type Memo = Nat;

    public type NeuronId = Nat64;

    public type NeuronIdAsText = Text;

    public type NeuronData = { neuron: Governance.Neuron; neuronInfo: ?Governance.NeuronInfo};

    public type NeuronsDataArray = [(NeuronIdAsText, NeuronData)];

    public type NeuronsDataMap = HashMap.HashMap<NeuronIdAsText, NeuronData>;

    public type NeuronDataMethodTypes = { 
        #GetFullNeuronResponse: {neuronId: Nat64; args: ?{contributor: Principal; amount: Nat64}};
        #GetNeuronInfoResponse: {neuronId: Nat64; args: ?{contributor: Principal; amount: Nat64}};
    };

    public type MemoToNeuronIdMap = HashMap.HashMap<Memo, NeuronId>;

    public type MemoToNeuronIdArray = [(Memo, NeuronId)];

    public type RequestId = Blob;

    public type Expiry = Nat64;

    public type ExpectedRequestResponses = {
        #CreateNeuronResponse: {memo: Nat64; contributor: Principal; amount: Nat64};
        #IncreaseNeuronResponse: {neuronId: Nat64};
        #GetFullNeuronResponse: {neuronId: Nat64; args: ?{contributor: Principal; amount: Nat64}};
        #GetNeuronInfoResponse: {neuronId: Nat64; args: ?{contributor: Principal; amount: Nat64}};
        #Spawn: {neuronId: Nat64;};
        #Split: {neuronId: Nat64;};
        #Follow: {neuronId: Nat64;};
        #ClaimOrRefresh: {neuronId: Nat64;};
        #Configure: {neuronId: Nat64;};
        #RegisterVote: {neuronId: Nat64;};
        #Disburse: {neuronId: Nat64;};
    };

    public type RequestResponses = {
        #CreateNeuronResponse: {response: Governance.ClaimOrRefreshResponse; memo: Nat64; contributor: Principal; amount: Nat64};
        #IncreaseNeuronResponse : {response: Governance.ClaimOrRefreshResponse; neuronId: Nat64};
        #GetFullNeuronResponse : {response: Governance.Result_2; neuronId: Nat64; args: ?{contributor: Principal; amount: Nat64}};
        #GetNeuronInfoResponse : {response: Governance.Result_5; neuronId: Nat64; args: ?{contributor: Principal; amount: Nat64}};
        #Error : {response: Governance.GovernanceError};
        #Spawn : { response: Governance.SpawnResponse; neuronId: Nat64};
        #Split : {response: Governance.SpawnResponse; neuronId: Nat64};
        #Follow : {response: {}; neuronId: Nat64};
        #ClaimOrRefresh : { response: Governance.ClaimOrRefreshResponse; neuronId: Nat64};
        #Configure : {response: {}; neuronId: Nat64};
        #RegisterVote : {response: {}; neuronId: Nat64};
        #Disburse : { response: Governance.DisburseResponse; neuronId: Nat64};
    };

    public type ReadRequestInput = {
        requestId: RequestId;
        expiry: Expiry;
        expectedResponseType: ExpectedRequestResponses;
        numberOfFailedAttempts: Nat;
    };


}