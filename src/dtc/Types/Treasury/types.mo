import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Governance "../../NNS/Governance";
import Account "../../Serializers/Account";
import IC "../../Types/IC/types";


module{

    public type SubaccountsMetaData = { owner: Text; };

    public type SubaccountRegistryArray = [(Blob, SubaccountsMetaData)];

    public type SubaccountRegistryMap = HashMap.HashMap<Blob, SubaccountsMetaData>;

    public type Identifier = {#Principal: Text; #SubaccountId: Account.Subaccount; #CampaignId: Nat};

    public type AccountType = {#FundingCampaign; #UserTreasuryData; #ExternalAccount; #MultiSigAccount};

    public type CampaignId = Nat;

    public type CampaignContributions = { icp: {e8s : Nat64;}; };

    public type CampaignContributionsArray = [(PrincipalAsText, CampaignContributions)];

    public type FundingCampaignAssets = {
        icp: {e8s : Nat64;};
        icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText};
    };

    public type FundingCampaign = {
        contributions: CampaignContributionsArray;
        amountToFund: {icp: {e8s : Nat64;}; };
        amountDisbursedToRecipient: {icp: {e8s : Nat64;}; };
        campaignWalletBalance: {icp: {e8s : Nat64;}; };
        recipient: PrincipalAsText;
        subaccountId: Account.Subaccount;
        description: Text; 
        settled: Bool;
        funded: Bool;
        terms:?FundingCampaignTerms;
    };

    public type FundingCampaignTerms = {
        paymentIntervals: Nat64;
        nextPaymentDueDate: ?Int;
        paymentAmounts: {icp: {e8s : Nat64;}; };
        initialLoanInterestAmount: {icp: {e8s : Nat64;}; };
        remainingLoanInterestAmount: {icp: {e8s : Nat64;}; };
        initialCollateralLocked: {icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText}};
        remainingCollateralLocked: {icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText}};
        forfeitedCollateral: {icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText}};
        remainingLoanPrincipalAmount: {icp: {e8s : Nat64;}; };
        amountRepaidDuringCurrentPaymentInterval: {icp: {e8s : Nat64;}; };
    };

    public type FundingCampaignInput = {
        amountToFund: {icp: {e8s : Nat64;}; };
        description: Text; 
        terms:?FundingCampaignTermsInput
    };

    public type FundingCampaignTermsInput = {
        paymentIntervals: Nat64;
        paymentAmounts: {icp: {e8s : Nat64;}; };
        initialLoanInterestAmount: {icp: {e8s : Nat64;}; };
        initialCollateralLocked: {icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText}};
    };

    public type FundingCampaignsArray = [(CampaignId, FundingCampaign)];

    public type FundingCampaignsMap = HashMap.HashMap<CampaignId, FundingCampaign>;

    public type Balances = {
        icp: {e8s : Nat64;};
        eth: {e8s : Nat64};
        btc: {e8s : Nat64};
    };

    public type BalancesExport = {
        icp: {e8s : Nat64;};
        icp_staked: {e8s : Nat64;};
        icp_staked_collateralized: {e8s : Nat64;};
        eth: {e8s : Nat64};
        btc: {e8s : Nat64};
        voting_power: {e8s: Nat64};
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
        collateralized_stake_e8s : ?Nat64;
    };
    

    public type UserTreasuryData = {
        balances : Balances;
        subaccountId : Account.Subaccount;
        automaticallyContributeToLoans: ?Bool;
        automaticallyRepayLoans: ?Bool;
    };

    public type UserTreasuryDataExport = {
        balances : BalancesExport;
        subaccountId : Account.Subaccount;
        automaticallyContributeToLoans: ?Bool;
        automaticallyRepayLoans: ?Bool;
    };

    public type PrincipalAsText = Text;

    public type UsersTreasuryDataArray = [(PrincipalAsText, UserTreasuryData)];

    public type UsersTreasuryDataArrayExport = [(PrincipalAsText, UserTreasuryDataExport)];

    public type UsersTreasuryDataMap = HashMap.HashMap<PrincipalAsText, UserTreasuryData>;

    public type TreasuryDataExport = {
        neurons : { icp: NeuronsDataArray; };
        usersTreasuryDataArray : UsersTreasuryDataArrayExport;
        userTreasuryData : UserTreasuryDataExport;
        totalDeposits : {e8s : Nat64};
        daoWalletBalance: {e8s : Nat64};
        daoIcpAccountId: [Nat8];
        userPrincipal: Text;
        fundingCampaigns: FundingCampaignsArray;
    };

    public type Memo = Nat;

    public type NeuronId = Nat64;

    public type NeuronIdAsText = Text;

    public type NeuronContribution = (PrincipalAsText, NeuronStakeInfo);

    public type NeuronContributions = [NeuronContribution];

    public type NeuronData = { 
        contributions: NeuronContributions; 
        neuron: ?Governance.Neuron; 
        neuronInfo: ?Governance.NeuronInfo; 
        parentNeuronContributions: ?NeuronContributions; 
        proxyNeuron: ?NeuronIdAsText;
    };

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
        #GovernanceManageNeuronResponse: { neuronId: ?Nat64; memo: ?Nat64; proposer: ?Principal; treasuryCanisterId: ?Principal; };
        #GovernanceResult_2: {neuronId: Nat64;};
        #GovernanceResult_5: {neuronId: Nat64;};
    };

    public type ReadRequestResponseOutput = {
        #GovernanceResult_2 : {response: Governance.Result_2; neuronId: Nat64; };
        #GovernanceResult_5 : {response: Governance.Result_5; neuronId: Nat64; };
        #Error : Governance.GovernanceError;
        #Spawn : { created_neuron_id: Nat64; neuronId: Nat64;};
        #Follow : { neuronId: Nat64;};
        #ClaimOrRefresh : { neuronId: Nat64; memo: ?Nat64;};
        #Configure : { neuronId: Nat64; };
        #Disburse : { transfer_block_height: Nat64; neuronId: Nat64; treasuryCanisterId: Principal;};
    };

    public type ReadRequestInput = {
        requestId: RequestId;
        expiry: Expiry;
        expectedResponseType: ExpectedRequestResponses;
    };

    public type TransformFnSignature = query { response : IC.http_response; context: Blob } -> async IC.http_response;

    public let GetNeuronDataMethodNames = {
        getFullNeuron = "get_full_neuron";
        getNeuronInfo = "get_neuron_info";
    };

    public type GetNeuronDataInput = {
        args: NeuronId;
        selfAuthPrincipal: Principal; 
        public_key: Blob; 
        transformFn: TransformFnSignature;
        method_name: Text;
    };


    public type ManageNeuronInput = {
        args: Governance.ManageNeuron;
        selfAuthPrincipal: Principal;
        public_key: Blob; 
        transformFn: TransformFnSignature
    };

    public type UnprocessedHttpResponseAndRequestId = {
        response: IC.http_response; 
        requestId: RequestId; 
        ingress_expiry: Expiry;
    };

    public type ProcessResponseInput = {
        neuronDataMap: NeuronsDataMap;
        usersTreasuryDataMap: UsersTreasuryDataMap;
        pendingActionsMap: PendingActionsMap;
        actionLogsArrayBuffer: ActionLogsArrayBuffer;
        memoToNeuronIdMap: MemoToNeuronIdMap;
        updateTokenBalances: shared ( Identifier, SupportedCurrencies, accountType: AccountType ) -> async ();
        fundingCampaignsMap: FundingCampaignsMap;
        readRequestResponseOutput: ReadRequestResponseOutput;
        selfAuthPrincipal: Principal;
        publicKey: Blob;
        transformFn: TransformFnSignature
    };

    public type PendingAction = {
        expectedHttpResponseType: ?ExpectedRequestResponses;
        function: { #GetNeuronData: {input: GetNeuronDataInput; }; #ManageNeuron: {input: ManageNeuronInput;}; };
    };

    public type PendingActionExport = {
        #GetNeuronData: {args: NeuronId};
        #ManageNeuron: {args: Governance.ManageNeuron};
        #ProcessResponse: {args: ReadRequestResponseOutput};
    };

    public type PendingActionsMap = HashMap.HashMap<Text, PendingAction>;

    public type PendingActionArray = [(Text, PendingAction)];

    public type PendingActionArrayExport = [(Text, PendingActionExport)];

    public type ActionLogsArray = [(Text, Text)];

    public type ActionLogsArrayBuffer = Buffer.Buffer<(Text, Text)>; 

    public let NEURON_STATES = {
        locked: Int32 = 1;
        dissolving: Int32 = 2;
        unlocked: Int32 = 3;
        spawning: Int32 = 4;
    }
}