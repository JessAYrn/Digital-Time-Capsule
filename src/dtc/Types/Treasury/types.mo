import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
import Governance "../../NNS/Governance";
import Account "../../Serializers/Account";


module{

    public type SubaccountsMetaData = { owner: Text; };

    public type SubaccountRegistryArray = [(Blob, SubaccountsMetaData)];

    public type SubaccountRegistryMap = HashMap.HashMap<Blob, SubaccountsMetaData>;

    public type Identifier = {#Principal: Text; #SubaccountId: Account.Subaccount};

    public type Balances = {
        icp: {e8s : Nat64;};
        eth: {e8s : Nat64};
        btc: {e8s : Nat64};
    };

    public type BalancesExport = {
        icp: {e8s : Nat64;};
        icp_staked: {e8s : Nat64;};
        eth: {e8s : Nat64};
        btc: {e8s : Nat64};
    };

    public type SupportedCurrencies = {
        #Icp;
        #Eth;
        #Btc;
    };

    public type Error = {
        #ActionNotSupported;
        #StatusNot202;
        #TxFailed;
        #InsufficientFunds;
        #NeuronClaimFailed;
        #NoNeuronIdRetreived;
        #UnexpectedResponse : {response : Governance.Command_1};
        #NoTreasuryCanisterId;
    };

    public type NeuronStakeInfo = {
        stake_e8s : Nat64;
        voting_power : Nat64;
    };

    public type UserTreasuryData = {
        balances : Balances;
        subaccountId : Account.Subaccount;
    };

    public type UserTreasuryDataExport = {
        balances : BalancesExport;
        subaccountId : Account.Subaccount;
    };

    public type PrincipalAsText = Text;

    public type UsersTreasuryDataArray = [(PrincipalAsText, UserTreasuryData)];

    public type UsersTreasuryDataArrayExport = [(PrincipalAsText, UserTreasuryDataExport)];

    public type UsersTreasuryDataMap = HashMap.HashMap<PrincipalAsText, UserTreasuryData>;

    public type TransferIcpToNeuronResponse = {
        #ok : {public_key: Blob; selfAuthPrincipal: Principal;};
        #err: Error;
    };

    public type TreasuryDataExport = {
        neurons : { icp: NeuronsDataArray; };
        usersTreasuryDataArray : UsersTreasuryDataArrayExport;
        totalDeposits : {e8s : Nat64};
        daoWalletBalance: {e8s : Nat64};
        daoIcpAccountId: [Nat8];
        userPrincipal: Text;
    };

    public type Memo = Nat;

    public type NeuronId = Nat64;

    public type NeuronIdAsText = Text;

    public type NeuronContributions = [(PrincipalAsText, NeuronStakeInfo)];

    public type NeuronData = { contributions: NeuronContributions; neuron: ?Governance.Neuron; neuronInfo: ?Governance.NeuronInfo; parentNeuronContributions: ?NeuronContributions; };

    public type NeuronsDataArray = [(NeuronIdAsText, NeuronData)];

    public type NeuronsDataMap = HashMap.HashMap<NeuronIdAsText, NeuronData>;

    public type NeuronDataMethodTypes = { 
        #GetFullNeuronResponse: {neuronId: Nat64; };
        #GetNeuronInfoResponse: {neuronId: Nat64;};
    };

    public type MemoToNeuronIdMap = HashMap.HashMap<Memo, NeuronId>;

    public type MemoToNeuronIdArray = [(Memo, NeuronId)];

    public type RequestId = Blob;

    public type Expiry = Nat64;

    public type ExpectedRequestResponses = {
        #CreateNeuronResponse: {memo: Nat64; newNeuronIdPlaceholderKey: Text;};
        #GetFullNeuronResponse: {neuronId: Nat64;};
        #GetNeuronInfoResponse: {neuronId: Nat64;};
        #Spawn: {neuronId: Nat64; };
        #Split: {neuronId: Nat64; amount_e8s: Nat64; proposer: Principal;};
        #Follow: {neuronId: Nat64; };
        #ClaimOrRefresh: {neuronId: Nat64;};
        #Configure: {neuronId: Nat64; };
        #RegisterVote: {neuronId: Nat64; };
        #Disburse: {neuronId: Nat64; proposer: Principal; treasuryCanisterId: Principal;};
    };

    public type RequestResponses = {
        #CreateNeuronResponse: {response: Governance.ClaimOrRefreshResponse; memo: Nat64; newNeuronIdPlaceholderKey: Text; };
        #GetFullNeuronResponse : {response: Governance.Result_2; neuronId: Nat64; };
        #GetNeuronInfoResponse : {response: Governance.Result_5; neuronId: Nat64; };
        #Error : {response: Governance.GovernanceError;};
        #Spawn : { response: Governance.SpawnResponse; neuronId: Nat64;};
        #Split : {response: Governance.SpawnResponse; neuronId: Nat64; amount_e8s: Nat64; proposer: Principal;};
        #Follow : {response: {}; neuronId: Nat64;};
        #ClaimOrRefresh : { response: Governance.ClaimOrRefreshResponse; neuronId: Nat64;};
        #Configure : {response: {}; neuronId: Nat64; };
        #RegisterVote : {response: {}; neuronId: Nat64; };
        #Disburse : { response: Governance.DisburseResponse; neuronId: Nat64; proposer: Principal; treasuryCanisterId: Principal;};
    };

    public type ReadRequestInput = {
        requestId: RequestId;
        expiry: Expiry;
        expectedResponseType: ExpectedRequestResponses;
        numberOfFailedAttempts: Nat;
    };

    public type PendingAction = {
        args: ?Governance.ManageNeuron;
        expectedResponseType: ExpectedRequestResponses;
        selfAuthPrincipal: Principal;
        public_key: Blob;
    };

    public type PendingActionsMap = HashMap.HashMap<Text, PendingAction>;

    public type PendingActionArray = [(Text, PendingAction)];

    public type ActionLogsArray = [(Text, Text)];

    public type ActionLogsMap = HashMap.HashMap<Text,Text>;

}