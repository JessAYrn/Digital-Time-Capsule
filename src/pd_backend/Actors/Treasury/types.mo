import HashMap "mo:base/HashMap";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
import Governance "../../NNS/Governance";
import Account "../../Serializers/Account";


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

    public type Payment = {
        owed: {icp: {e8s : Nat64;}; };
        paid: {icp: {e8s : Nat64;}; };
        collateralForfeited: {icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText}};
        collateralReleased: {icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText}};
        dueDate: Int;
    };

    public type FundingCampaignLoanAgreement = {
        numberOfPayments: Nat64;
        paymentTermPeriod: Nat64;
        payments: [Payment];
        loanPrincipal: {icp: {e8s : Nat64;}; };
        loanInterest: {icp: {e8s : Nat64;}; };
        collateralProvided: {icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText}};
    };

    public type FundingCampaignLoanAgreementInput = {
        paymentTermPeriod: Nat64;
        numberOfPayments: Nat64;
        loanInterest: {icp: {e8s : Nat64;}; };
        collateralProvided: {icp_staked: {e8s : Nat64; fromNeuron: NeuronIdAsText}};
    };

    public type FundingCampaignInput = {
        amountToFund: {icp: {e8s : Nat64;}; };
        description: Text; 
        loanAgreement:?FundingCampaignLoanAgreementInput
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
        loanAgreement: ?FundingCampaignLoanAgreement;
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

    public type UserTreasuryData_V2 = {
        balances : Balances;
        subaccountId : Account.Subaccount;
        automaticallyContributeToLoans: Bool;
        automaticallyRepayLoans: Bool;
    };

    public type UserTreasuryDataExport = {
        balances : BalancesExport;
        subaccountId : Account.Subaccount;
        automaticallyContributeToLoans: Bool;
        automaticallyRepayLoans: Bool;
    };

    public type PrincipalAsText = Text;

    public type UsersTreasuryDataArray = [(PrincipalAsText, UserTreasuryData)];

    public type UsersTreasuryDataArray_V2 = [(PrincipalAsText, UserTreasuryData_V2)];

    public type UsersTreasuryDataArrayExport = [(PrincipalAsText, UserTreasuryDataExport)];

    public type UsersTreasuryDataMap = HashMap.HashMap<PrincipalAsText, UserTreasuryData>;

    public type UsersTreasuryDataMap_V2 = HashMap.HashMap<PrincipalAsText, UserTreasuryData_V2>;

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

    public let NEURON_STATES = {
        locked: Int32 = 1;
        dissolving: Int32 = 2;
        unlocked: Int32 = 3;
        spawning: Int32 = 4;
    }
}