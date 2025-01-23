import Account "Serializers/Account";
import Ledger "NNS/Ledger";
import Governance "NNS/Governance";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import TreasuryTypes "Types/Treasury/types";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Timer "mo:base/Timer";
import IC "Types/IC/types";
import Debug "mo:base/Debug";
import AnalyticsTypes "Types/Analytics/types";
import AsyncronousHelperMethods "Modules/Treasury/AsyncronousHelperMethods";
import SyncronousHelperMethods "Modules/Treasury/SyncronousHelperMethods";
import NatX "MotokoNumbers/NatX";

shared actor class Treasury (principal : Principal) = this {

    private stable let ownerCanisterId : Text = Principal.toText(principal);
    private stable var sumOfAllTokenBalances : AnalyticsTypes.Balances = { icp = {e8s = 0}; icp_staked = {e8s = 0}; eth = {e8s = 0}; btc = {e8s = 0}; };
    private stable var usersTreasuryDataArray : TreasuryTypes.UsersTreasuryDataArray = [];
    private var usersTreasuryDataMap : TreasuryTypes.UsersTreasuryDataMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryData>(Iter.fromArray(usersTreasuryDataArray), Iter.size(Iter.fromArray(usersTreasuryDataArray)), Text.equal, Text.hash);
    private stable var balancesHistoryArray : AnalyticsTypes.BalancesArray = [];
    private var balancesHistoryMap : AnalyticsTypes.BalancesMap = HashMap.fromIter<Text, AnalyticsTypes.Balances>(Iter.fromArray(balancesHistoryArray), Iter.size(Iter.fromArray(balancesHistoryArray)), Text.equal, Text.hash);
    private stable var neuronDataArray : TreasuryTypes.NeuronsDataArray = [];
    private var neuronDataMap : TreasuryTypes.NeuronsDataMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronData>(Iter.fromArray(neuronDataArray), Iter.size(Iter.fromArray(neuronDataArray)), Text.equal, Text.hash);
    private let txFee : Nat64 = 10_000;
    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);
    private stable var neuronMemo : Nat64 = 0;
    private stable var fundingCampaignsArray : TreasuryTypes.FundingCampaignsArray = [];
    private var fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap = HashMap.fromIter<TreasuryTypes.CampaignId, TreasuryTypes.FundingCampaign>(Iter.fromArray(fundingCampaignsArray), Iter.size(Iter.fromArray(fundingCampaignsArray)), Nat.equal, Hash.hash);
    private stable var campaignIndex : Nat = 0;
    private stable var newlyCreatedNeuronContributions : TreasuryTypes.NeuronContributions = [];

    let {recurringTimer; setTimer} = Timer;

    public shared({caller}) func configureTreasuryCanister(): async (){
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        usersTreasuryDataMap.put(Principal.toText(Principal.fromActor(this)), {
            balances = { icp = {e8s : Nat64 = 0;}; eth = {e8s : Nat64 = 0}; btc = {e8s : Nat64 = 0}; };
            automaticallyContributeToLoans: ?Bool = ?true;
            automaticallyRepayLoans: ?Bool = ?true;
            subaccountId = Account.defaultSubaccount();
        });
    };

    public shared({caller}) func createFundingCampaign(campaign: TreasuryTypes.FundingCampaignInput, userPrincipal: Text) : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let terms = switch(campaign.terms){
            case null { null };
            case (?terms) { 
                let {stake_e8s = userStakedIcp; collateralized_stake_e8s} = SyncronousHelperMethods.getUserNeuronStakeInfo(userPrincipal, neuronDataMap, terms.initialCollateralLocked.icp_staked.fromNeuron);
                let userCollateralizedStakedIcp : Nat64 = switch(collateralized_stake_e8s){case (?collateralizedStake) {collateralizedStake}; case (null) {0;}};
                let stakeAvailabletoCollateralize = userStakedIcp - userCollateralizedStakedIcp;
                if (stakeAvailabletoCollateralize < terms.initialCollateralLocked.icp_staked.e8s) throw Error.reject("User has insufficient staked ICP.");
                SyncronousHelperMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal; delta = terms.initialCollateralLocked.icp_staked.e8s; neuronId = terms.initialCollateralLocked.icp_staked.fromNeuron; operation = #AddCollateralizedStake});
                ?{  terms with 
                    remainingLoanInterestAmount = {icp = { e8s : Nat64 = 0 }};
                    remainingLoanPrincipalAmount = {icp = { e8s : Nat64 = 0 }};
                    remainingCollateralLocked = terms.initialCollateralLocked;
                    forfeitedCollateral = {terms.initialCollateralLocked with icp_staked = { terms.initialCollateralLocked.icp_staked with e8s : Nat64 = 0;} };
                    amountRepaidDuringCurrentPaymentInterval = {icp = { e8s : Nat64 = 0 }};
                    nextPaymentDueDate = null;
                };
            };
        };
        fundingCampaignsMap.put(campaignIndex, {
            campaign with 
            contributions = []; 
            recipient = userPrincipal;
            subaccountId = await getUnusedSubaccountId(); 
            settled = false;
            funded = false;
            campaignWalletBalance = {icp = {e8s: Nat64 = 0}; }; 
            amountDisbursedToRecipient = {icp = {e8s: Nat64 = 0}; }; 
            terms;
        });
        campaignIndex += 1;
    };

    public query({caller}) func getFundingCampainsArray() : async TreasuryTypes.FundingCampaignsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    public shared({caller}) func cancelFundingCampaign(campaignId: Nat): async TreasuryTypes.FundingCampaignsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {funded; campaignWalletBalance; terms;} = campaign;
        if(funded) throw Error.reject("Funding campaign has already been funded.");
        await AsyncronousHelperMethods.distributePayoutsFromFundingCampaign(campaignId, campaignWalletBalance.icp.e8s, usersTreasuryDataMap, updateTokenBalances, fundingCampaignsMap, Principal.fromActor(this));
        let updatedTerms: ?TreasuryTypes.FundingCampaignTerms = switch(terms){case null { null }; case (?terms) { 
            let { remainingCollateralLocked } = terms;
            SyncronousHelperMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = campaign.recipient; delta = remainingCollateralLocked.icp_staked.e8s; neuronId = remainingCollateralLocked.icp_staked.fromNeuron; operation = #SubtractCollateralizedStake});
            ?{ terms with remainingCollateralLocked = {remainingCollateralLocked with icp_staked = {remainingCollateralLocked.icp_staked with e8s: Nat64 = 0}}; };
        };};
        fundingCampaignsMap.put(campaignId, {campaign with terms = updatedTerms; settled = true});
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    public shared({caller}) func contributeToFundingCampaign(contributor: TreasuryTypes.PrincipalAsText, campaignId: Nat, amount: Nat64) 
    : async TreasuryTypes.FundingCampaignsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        await AsyncronousHelperMethods.contributeToFundingCampaign(contributor, campaignId, amount, fundingCampaignsMap, usersTreasuryDataMap, Principal.fromActor(this), updateTokenBalances);
    };

    public shared({caller}) func contributeToAllFundingCampaignsForLoans(contributor: TreasuryTypes.PrincipalAsText, amount: Nat64) : async TreasuryTypes.FundingCampaignsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let {totalLoansAwaitingContributions} = SyncronousHelperMethods.getTotalFundingAwaitingContributions(fundingCampaignsMap);
        let totalAmountToContribute = Nat64.min(amount, totalLoansAwaitingContributions);
        label makingContributions for((campaignId, campaign) in fundingCampaignsMap.entries()){
            let {settled; funded; amountToFund = loanAmount; terms;} = campaign;
            if(settled or funded or terms == null) continue makingContributions;
            let amountToContributeToThisCampaign = NatX.nat64ComputePercentage({value = totalAmountToContribute; numerator = loanAmount.icp.e8s; denominator = totalLoansAwaitingContributions});
            ignore contributeToFundingCampaign(contributor, campaignId, amountToContributeToThisCampaign);
        };
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    private func makeContributionsByAllUsersToAllFundingCampaignsForLoans(): async () {
        var totalLiquidityAvailableForLoans: Nat64 = 0;

        label summingAvailableLiquidity for((principal, {balances; automaticallyContributeToLoans}) in usersTreasuryDataMap.entries()){ 
            if(principal == Principal.toText(Principal.fromActor(this))) continue summingAvailableLiquidity;
            switch(automaticallyContributeToLoans){ case(?true){totalLiquidityAvailableForLoans += balances.icp.e8s;}; case(_){}; }; 
        };

        let {totalLoansAwaitingContributions} = SyncronousHelperMethods.getTotalFundingAwaitingContributions(fundingCampaignsMap);

        label makingContributions for((userPrincipal, {automaticallyContributeToLoans; balances}) in usersTreasuryDataMap.entries()){ 
            switch(automaticallyContributeToLoans){ 
                case (?true){
                    let userLiquidityAvailableForLoans = balances.icp.e8s;
                    let portionOfAwaitingLoansToBeProvidedByThisUser = NatX.nat64ComputePercentage({value = totalLoansAwaitingContributions; numerator = userLiquidityAvailableForLoans; denominator = totalLiquidityAvailableForLoans});
                    let amountToContribute = Nat64.min(userLiquidityAvailableForLoans, portionOfAwaitingLoansToBeProvidedByThisUser);
                    ignore contributeToAllFundingCampaignsForLoans(userPrincipal, amountToContribute);
                };
                case(_){ continue makingContributions };
            };
        };
    };

    public shared({caller}) func repayFundingCampaign(contributor: TreasuryTypes.PrincipalAsText, campaignId: Nat, amount: Nat64) : async TreasuryTypes.FundingCampaignsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let (_, subaccountId) = SyncronousHelperMethods.getIdAndSubaccount(#Principal(contributor), usersTreasuryDataMap, fundingCampaignsMap);
        await AsyncronousHelperMethods.repayFundingCampaign(amount + txFee, {subaccountId = ?subaccountId; accountType = #UserTreasuryData}, campaignId, fundingCampaignsMap, usersTreasuryDataMap, neuronDataMap, updateTokenBalances, Principal.fromActor(this) );
    };

    public shared({caller}) func repayAllFundingCampaignsOwedByUser(contributor: TreasuryTypes.PrincipalAsText, maxAmountToRepay: Nat64) : async TreasuryTypes.FundingCampaignsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let {totalDebtsDue;} = SyncronousHelperMethods.getTotalDebtsByUser(contributor, fundingCampaignsMap);
        let totalAmountToRepay = Nat64.min(maxAmountToRepay, totalDebtsDue);
        label makingPayments for((campaignId, {recipient; terms; settled; funded }) in fundingCampaignsMap.entries()){
            if(settled or not funded or recipient != contributor) continue makingPayments;
            let ?{ paymentAmounts; amountRepaidDuringCurrentPaymentInterval; } = terms else continue makingPayments; 
            let debtDueOnThisLoan: Nat64 = switch(paymentAmounts.icp.e8s > amountRepaidDuringCurrentPaymentInterval.icp.e8s){
                case true { paymentAmounts.icp.e8s - amountRepaidDuringCurrentPaymentInterval.icp.e8s; };
                case false { 0; };
            };
            let amountToRepayOnThisLoan = NatX.nat64ComputePercentage({value = totalAmountToRepay; numerator = debtDueOnThisLoan; denominator = totalDebtsDue});
            ignore repayFundingCampaign(contributor, campaignId, amountToRepayOnThisLoan);
        };
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    private func repayAllFundingCampaignsOwedByAllUsers(): async (){
        for((userPrincipal, {automaticallyRepayLoans; balances}) in usersTreasuryDataMap.entries()){ 
            switch(automaticallyRepayLoans){
                case (?true){ 
                    let maxAmountToRepay = balances.icp.e8s;
                    ignore repayAllFundingCampaignsOwedByUser(userPrincipal, maxAmountToRepay); 
                };
                case (_){};
            };
        };
    };
    
    private func concludeAllEligbileBillingCycles(): async () {
        func concludeBillingCycle(campaignId: Nat, campaign: TreasuryTypes.FundingCampaign): async () {
            let {recipient; amountDisbursedToRecipient; contributions} = campaign;
            let ?terms = campaign.terms else return;
            let { paymentIntervals; paymentAmounts; remainingCollateralLocked; initialCollateralLocked; amountRepaidDuringCurrentPaymentInterval; forfeitedCollateral; remainingLoanPrincipalAmount; remainingLoanInterestAmount } = terms;

            let (updatedAmountRepaidDuringCurrentPaymentInterval, paymentAmountMissed) : (Nat64, Nat64) = if(amountRepaidDuringCurrentPaymentInterval.icp.e8s < paymentAmounts.icp.e8s) {
                (0, paymentAmounts.icp.e8s - amountRepaidDuringCurrentPaymentInterval.icp.e8s);
            } else {  (amountRepaidDuringCurrentPaymentInterval.icp.e8s - paymentAmounts.icp.e8s, 0);  };

            let amountOfCollateralForfeited = Nat64.min( remainingCollateralLocked.icp_staked.e8s, NatX.nat64ComputePercentage({value = initialCollateralLocked.icp_staked.e8s; numerator = paymentAmountMissed; denominator = amountDisbursedToRecipient.icp.e8s}));
            let updatedRemainingCollateralLocked = {remainingCollateralLocked with icp_staked = { remainingCollateralLocked.icp_staked with e8s = remainingCollateralLocked.icp_staked.e8s - amountOfCollateralForfeited } };
            let updatedForfeitedCollateral = {forfeitedCollateral with icp_staked = { forfeitedCollateral.icp_staked with e8s = forfeitedCollateral.icp_staked.e8s + amountOfCollateralForfeited} };
            let nextPaymentDueDate = ?(Time.now() + Nat64.toNat(paymentIntervals));

            SyncronousHelperMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = recipient; delta = amountOfCollateralForfeited; neuronId = initialCollateralLocked.icp_staked.fromNeuron; operation = #SubtractCollateralizedStake});
            SyncronousHelperMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = recipient; delta = amountOfCollateralForfeited; neuronId = initialCollateralLocked.icp_staked.fromNeuron; operation = #SubtractStake});
            SyncronousHelperMethods.redistributeStakeToLoanContributors(amountOfCollateralForfeited, contributions,neuronDataMap, initialCollateralLocked.icp_staked.fromNeuron);
            let settled = switch(initialCollateralLocked.icp_staked.e8s > 0){ case false { remainingLoanPrincipalAmount.icp.e8s + remainingLoanInterestAmount.icp.e8s == 0 }; case true { updatedRemainingCollateralLocked.icp_staked.e8s == 0} };
            fundingCampaignsMap.put(campaignId, { campaign with settled; terms = ?{ terms with nextPaymentDueDate; remainingCollateralLocked = updatedRemainingCollateralLocked; forfeitedCollateral = updatedForfeitedCollateral; amountRepaidDuringCurrentPaymentInterval = {icp = {e8s = updatedAmountRepaidDuringCurrentPaymentInterval}};};});
        };

        label concludeEllibleBillingCycles for((campaignId, campaign) in fundingCampaignsMap.entries()){
            let {settled; funded; terms} = campaign;
            if(settled or not funded) continue concludeEllibleBillingCycles;
            let ?{nextPaymentDueDate;} = terms else continue concludeEllibleBillingCycles;
            let ?nextPaymentDueDate_ = nextPaymentDueDate else continue concludeEllibleBillingCycles;
            if(Time.now() >= nextPaymentDueDate_) ignore concludeBillingCycle(campaignId, campaign);
        };
    };
    
    private func disburseEligibleCampaignFundingsToRecipient() : async () {
        func disburseCampaignFundingToRecipient(campaignId: Nat, campaign: TreasuryTypes.FundingCampaign): async () {
            let {campaignWalletBalance; recipient; subaccountId = campaignSubaccountId} = campaign;
            var updatedCampaign = campaign;
            let (_,recipientSubaccountId) = SyncronousHelperMethods.getIdAndSubaccount(#Principal(recipient), usersTreasuryDataMap, fundingCampaignsMap);
            let {amountSent} = await transferICP(
                campaignWalletBalance.icp.e8s, 
                {identifier = #SubaccountId(campaignSubaccountId); accountType = #FundingCampaign},
                {owner = Principal.fromActor(this); subaccount = ?recipientSubaccountId; accountType = #UserTreasuryData}
            );
            updatedCampaign := {
                campaign with funded = true; settled = true;
                campaignWalletBalance = {icp = { e8s = Nat64.fromNat( await ledger.icrc1_balance_of({owner = Principal.fromActor(this); subaccount = ?campaignSubaccountId})) }};
                amountDisbursedToRecipient = {icp = {e8s = amountSent}};
            };
            updatedCampaign := switch(campaign.terms){
                case null { updatedCampaign };
                case (?terms){
                    { 
                        updatedCampaign with 
                        settled = false;
                        terms = ?{
                            terms with
                            nextPaymentDueDate: ?Int = ?(Time.now() + Nat64.toNat(terms.paymentIntervals));
                            remainingLoanInterestAmount = terms.initialLoanInterestAmount;
                            remainingLoanPrincipalAmount = updatedCampaign.amountDisbursedToRecipient;
                            remainingCollateralLocked = terms.initialCollateralLocked;
                            forfeitedCollateral = { 
                                terms.initialCollateralLocked.icp_staked with 
                                icp_staked = {
                                    terms.initialCollateralLocked.icp_staked with 
                                    e8s: Nat64 = 0; 
                                };
                            };
                        }
                    };
                };
            };
            fundingCampaignsMap.put(campaignId,updatedCampaign);
        };

        label loop_ for((campaignId, campaign) in fundingCampaignsMap.entries()){
            let {settled; funded; amountToFund; campaignWalletBalance} = campaign;
            if(settled or funded) continue loop_;
            if( campaignWalletBalance.icp.e8s >= amountToFund.icp.e8s - (2 * txFee) ){
                ignore disburseCampaignFundingToRecipient(campaignId, campaign);
            };
        };
    };

    private func getUnusedSubaccountId(): async Account.Subaccount {
        var newSubaccount = await Account.getRandomSubaccount();
        var match = false;
        label innerLoop for((_, {subaccountId}) in usersTreasuryDataMap.entries()){
            if(Blob.equal(subaccountId, newSubaccount) ){ match := true; break innerLoop; };
        };
        if(match) newSubaccount := await getUnusedSubaccountId();
        return newSubaccount;
    };

    private func createTreasuryData_(principal: Principal) : async () {
        var newSubaccount = Account.defaultSubaccount();
        if(not Principal.equal(principal, Principal.fromActor(this))) newSubaccount := await getUnusedSubaccountId(); 
        let newUserTreasuryData = {
            balances = {
                icp = {e8s: Nat64 = 0};
                icp_staked = {e8s: Nat64 = 0};
                eth = {e8s: Nat64 = 0};
                btc = {e8s: Nat64 = 0};
            };
            subaccountId = newSubaccount;
            automaticallyContributeToLoans = ?true;
            automaticallyRepayLoans = ?true;
        };
        usersTreasuryDataMap.put(Principal.toText(principal), newUserTreasuryData);
    };

    public shared({caller}) func createTreasuryData(principal: Principal) : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let principalAsText = Principal.toText(principal);
        if(usersTreasuryDataMap.get(principalAsText) != null) throw Error.reject("User already has treasury data.");
        await createTreasuryData_(principal);
    };

    public shared({caller}) func updateAutomatedSettings({userPrinciapl: Principal; automaticallyContributeToLoans: ?Bool; automaticallyRepayLoans: ?Bool;}):
    async {automaticallyContributeToLoans: ?Bool; automaticallyRepayLoans: ?Bool;} {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let userPrincipalAsText = Principal.toText(userPrinciapl);
        let ?userTreasuryData = usersTreasuryDataMap.get(userPrincipalAsText) else throw Error.reject("User not found.");
        let newUserTreasuryData = {userTreasuryData with automaticallyContributeToLoans; automaticallyRepayLoans};
        usersTreasuryDataMap.put(userPrincipalAsText, newUserTreasuryData);
        return {automaticallyContributeToLoans; automaticallyRepayLoans};
    };
    
    // revised to conform to new data structure
    public query({caller}) func getUsersTreasuryDataArray(): async TreasuryTypes.UsersTreasuryDataArrayExport {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let usersDataExport = Iter.map<
            (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryData),
            (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryDataExport)
        >( usersTreasuryDataMap.entries(), func(
            (principal, userTreasuryData): (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryData)) : 
            (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryDataExport) {
                SyncronousHelperMethods.formatUserTreasuryDataForExport(neuronDataMap, (principal, userTreasuryData));
            }
        );
        return Iter.toArray(usersDataExport);
    };
    
    public query({caller}) func getUserTreasuryData(userPrincipal: Principal): async TreasuryTypes.UserTreasuryDataExport {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let userPrincipalAsText = Principal.toText(userPrincipal);
        let userTreasuryData = switch(usersTreasuryDataMap.get(userPrincipalAsText)){ case (?userTreasuryData) { userTreasuryData }; case (null) { throw Error.reject("User not found."); }; };
        let (_, userTreasuryDataExport) = SyncronousHelperMethods.formatUserTreasuryDataForExport(neuronDataMap, (userPrincipalAsText, userTreasuryData));
        return userTreasuryDataExport;
    };

    public query({caller}) func getDaoTotalStakeAndVotingPower(): async {totalVotingPower: Nat64; totalStake: Nat64} {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        var totalVotingPower: Nat64 = 0;
        var totalStake: Nat64 = 0;
        label loop_ for((neuronIdAsText, neuronData) in neuronDataMap.entries()){
            let ?neuronInfo = neuronData.neuronInfo else continue loop_;
            totalVotingPower += neuronInfo.voting_power;
            totalStake += neuronInfo.stake_e8s;
        };
        return {totalVotingPower; totalStake};
    }; 

    public query({caller}) func getDaoTotalDeposits(): async {totalDeposits: {e8s: Nat64};} {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return {totalDeposits = {e8s = sumOfAllTokenBalances.icp.e8s};};
    };

    // need to update this function to save the sum of all subaccounts as the total balance for icp.
    public shared({caller}) func saveCurrentBalances() : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let currentTime = Int.toText(Time.now());
        balancesHistoryMap.put(currentTime, sumOfAllTokenBalances);
    };

    public query({caller}) func readBalancesHistory() : async AnalyticsTypes.BalancesArray{
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(balancesHistoryMap.entries());
    };

    private func tresasuryIcpAccountId(subaccount: ?Account.Subaccount) : Account.AccountIdentifier {
        let subaccount_ = switch(subaccount){case (?subaccountId) { subaccountId }; case(null) {Account.defaultSubaccount()}};
        Account.accountIdentifier(Principal.fromActor(this), subaccount_);
    };

    public query({caller}) func canisterIcpAccountId(subaccount: ?Account.Subaccount) : async Account.AccountIdentifier {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        tresasuryIcpAccountId(subaccount);
    };

    public shared({caller}) func manageNeuron(args: Governance.ManageNeuron) : async Governance.ManageNeuronResponse {        
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let (manageNeuronResponse, neuronContributions) = await AsyncronousHelperMethods.manageNeuron(neuronDataMap, args, newlyCreatedNeuronContributions); 
        func completeDisbursements(): async () {
            let ?neuronId_ = args.id else { throw Error.reject("No neuronId in response") };
            await AsyncronousHelperMethods.distributePayoutsFromNeuron( Nat64.toText(neuronId_.id), usersTreasuryDataMap, updateTokenBalances, neuronDataMap, Principal.fromActor(this));
            ignore neuronDataMap.remove(Nat64.toText(neuronId_.id));
        };
        switch(manageNeuronResponse.command){
            case(?#Disburse(_)){ ignore completeDisbursements(); };
            case(?#MakeProposal(_)){ switch(args.command){ case(?#Disburse(_)){ ignore completeDisbursements(); }; case(_){}; } };
            case(?#Error({error_message;})){throw Error.reject(error_message) };
            case(null) { throw Error.reject("Error managing neuron.") };
            case(_){};
        };
        ignore AsyncronousHelperMethods.upateNeuronsDataMap(neuronDataMap, neuronContributions);
        return manageNeuronResponse;
    };

    public shared({caller}) func updateNeuronDataMap(): async (){
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        await AsyncronousHelperMethods.upateNeuronsDataMap(neuronDataMap, ?newlyCreatedNeuronContributions);
    };

    public shared({caller}) func createNeuron({amount: Nat64; contributor: Principal}) : async Result.Result<({amountSent: Nat64}), TreasuryTypes.Error>{
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let ?{subaccountId} = usersTreasuryDataMap.get(Principal.toText(contributor)) else Debug.trap("No subaccount for contributor");
        let {amountSent} = await AsyncronousHelperMethods.transferIcpToNeuron(amount, #Memo(neuronMemo), subaccountId, Principal.fromActor(this));
        ignore updateTokenBalances(#Principal(Principal.toText(contributor)), #Icp, #UserTreasuryData);
        newlyCreatedNeuronContributions := [(Principal.toText(contributor), {stake_e8s : Nat64 = amountSent; voting_power: Nat64 = 0; collateralized_stake_e8s = null})];
        let args = { id = null; command = ?#ClaimOrRefresh( {by = ?#MemoAndController( {controller = ?Principal.fromActor(this); memo = neuronMemo} )} ); neuron_id_or_subaccount = null; };
        ignore manageNeuron(args);
        neuronMemo += 1;
        return #ok({amountSent});
    };

    public shared({caller}) func increaseNeuron({amount: Nat64; neuronId: Nat64; contributor: Principal; onBehalfOf: ?TreasuryTypes.PrincipalAsText}): async Result.Result<({amountSent: Nat64}) , TreasuryTypes.Error>{
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let ?neuronData = neuronDataMap.get(Nat64.toText(neuronId)) else Debug.trap("No neuron data for neuronId");
        let ?neuron = neuronData.neuron else Debug.trap("No neuron for neuronId");
        let {account = neuronSubaccount} = neuron;
        let ?{subaccountId} = usersTreasuryDataMap.get(Principal.toText(contributor)) else Debug.trap("No subaccount for contributor");
        let {amountSent} = await AsyncronousHelperMethods.transferIcpToNeuron(amount, #NeuronSubaccountId(neuronSubaccount), subaccountId, Principal.fromActor(this));
        ignore updateTokenBalances(#Principal(Principal.toText(contributor)), #Icp, #UserTreasuryData);
        let principalToCredit = switch(onBehalfOf){case (?principal){principal}; case (null){Principal.toText(contributor);};};
        SyncronousHelperMethods.updateUserNeuronContribution( neuronDataMap,{ userPrincipal = principalToCredit;  delta = amountSent; neuronId = Nat64.toText(neuronId); operation = #AddStake;});
        let args = { id = ?{id = neuronId}; command = ?#ClaimOrRefresh( {by = ?#NeuronIdOrSubaccount({})} ); neuron_id_or_subaccount = null; };
        ignore manageNeuron(args);
        return #ok({amountSent});
    };

    public query({caller}) func getNeuronsDataArray() : async TreasuryTypes.NeuronsDataArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(neuronDataMap.entries());
    };

    // need to revise this to retrieve the balance of a given subaccount or principal
    public query({caller}) func daoWalletIcpBalance() : async Ledger.ICP {
        let canisterId =  Principal.fromActor(this);
        if( Principal.toText(caller) !=  Principal.toText(canisterId) and Principal.toText(caller) != ownerCanisterId) { throw Error.reject("Unauthorized access."); };
        let ?treasuryData = usersTreasuryDataMap.get(Principal.toText(Principal.fromActor(this))) else throw Error.reject("User not found.");
        return treasuryData.balances.icp;
    };
    
    public shared({caller}) func updateTokenBalances( identifier: TreasuryTypes.Identifier, currency: TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType) : async () {
        if( Principal.toText(caller) !=  Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) { throw Error.reject("Unauthorized access."); };
        func onUserTreasuryDataOrMultiSigAccountTypes(userPrincipal: Text, subaccountID: Blob): async(){
            let ?userTreasuryData = usersTreasuryDataMap.get(userPrincipal) else throw Error.reject("User not found.");
            let updatedUserTreasuryData = switch(currency){
                case(#Icp){ 
                    let e8s: Nat64 = Nat64.fromNat(await ledger.icrc1_balance_of({ owner = Principal.fromActor(this); subaccount = ?subaccountID })); 
                    {userTreasuryData with balances = { userTreasuryData.balances with icp = {e8s}}; };
                };
                case(#Eth) { throw Error.reject("Eth not yet supported."); };
                case(#Btc) { throw Error.reject("Btc not yet supported."); };
            };
            usersTreasuryDataMap.put(userPrincipal, updatedUserTreasuryData);
        };

        func onFundingCampaignAccountType(campaignId: Nat, subaccountID: Blob): async(){
            let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
            let updatedCampaign = switch(currency){
                case(#Icp){ 
                    let e8s: Nat64 = Nat64.fromNat(await ledger.icrc1_balance_of({ owner = Principal.fromActor(this); subaccount = ?subaccountID })); 
                    {campaign with campaignWalletBalance = { campaign.campaignWalletBalance with icp = {e8s}}; };
                };
                case(#Eth) { throw Error.reject("Eth not yet supported."); };
                case(#Btc) { throw Error.reject("Btc not yet supported."); };
            };
            fundingCampaignsMap.put(campaignId, updatedCampaign);
        };

        let (id, subaccountID) = SyncronousHelperMethods.getIdAndSubaccount(identifier, usersTreasuryDataMap, fundingCampaignsMap);

        switch(accountType){
            case(#UserTreasuryData){ await onUserTreasuryDataOrMultiSigAccountTypes(id, subaccountID); };
            case(#MultiSigAccount){ await onUserTreasuryDataOrMultiSigAccountTypes(id, subaccountID); };
            case(#FundingCampaign){ 
                let ?campaignId = Nat.fromText(id) else throw Error.reject("Invalid campaign id.");
                await onFundingCampaignAccountType(campaignId, subaccountID); 
            };  
            case(#ExternalAccount){};
        };

        let {totalStake} = await getDaoTotalStakeAndVotingPower();
        var icp_e8s: Nat64 = 0;
        for((principal, treasuryData) in usersTreasuryDataMap.entries()) icp_e8s += treasuryData.balances.icp.e8s;
        for((_, campaign) in fundingCampaignsMap.entries()) icp_e8s += campaign.campaignWalletBalance.icp.e8s;
        sumOfAllTokenBalances := {
            eth = {e8s: Nat64 = 0};
            btc = {e8s: Nat64 = 0}; 
            icp = {e8s = icp_e8s}; 
            icp_staked = {e8s = totalStake};
        };
    };

    public query ({caller}) func getCyclesBalance(): async Nat {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Cycles.balance();
    };

    // Return the cycles received up to the capacity allowed
    public shared func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let accepted = Cycles.accept<system>(amount);
        { accepted = Nat64.fromNat(accepted) };
    };

    public query func transformFn({ response : IC.http_response; }) : async IC.http_response {
        let transformed : IC.http_response = { status = response.status; body = response.body; headers = []; };
        transformed;
    };

    public shared({caller}) func transferICP(
        amount: Nat64, 
        sender: { identifier: TreasuryTypes.Identifier; accountType: TreasuryTypes.AccountType}, 
        recipient : {owner: Principal; subaccount: ?Account.Subaccount; accountType: TreasuryTypes.AccountType}
    ) : async {amountSent: Nat64} {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        if(amount < txFee){ return {amountSent: Nat64 = 0}; };
        let senderSubaccount = switch(sender.identifier){
            case (#SubaccountId(subaccount)) { subaccount };
            case (_){ let (_, subaccount) = SyncronousHelperMethods.getIdAndSubaccount(sender.identifier, usersTreasuryDataMap, fundingCampaignsMap); subaccount};
        };
        await AsyncronousHelperMethods.performTransfer(
            amount, 
            {subaccountId = ?senderSubaccount; accountType = sender.accountType}, 
            {
                owner = recipient.owner; 
                accountType = recipient.accountType;
                subaccountId = switch(recipient.subaccount){ case (?subaccount) {?subaccount}; case (null) { null };}
            }, 
            updateTokenBalances
        );
    };

    system func preupgrade() { 
        usersTreasuryDataArray := Iter.toArray(usersTreasuryDataMap.entries()); 
        balancesHistoryArray := Iter.toArray(balancesHistoryMap.entries());
        neuronDataArray := Iter.toArray(neuronDataMap.entries());
        fundingCampaignsArray := Iter.toArray(fundingCampaignsMap.entries());
    };

    system func postupgrade() { 
        usersTreasuryDataArray:= []; 
        balancesHistoryArray := [];
        neuronDataArray := [];
        fundingCampaignsArray := [];

        ignore recurringTimer<system>(#seconds(6 * 60 * 60), func (): async () { 
            ignore disburseEligibleCampaignFundingsToRecipient();
            ignore concludeAllEligbileBillingCycles();
        });
        ignore recurringTimer<system>(#seconds(24 * 60 * 60), func (): async () { 
            await AsyncronousHelperMethods.upateNeuronsDataMap(neuronDataMap, null);
            ignore setTimer<system>(#seconds(5 * 60), func(): async (){ ignore repayAllFundingCampaignsOwedByAllUsers(); });
            ignore setTimer<system>(#seconds(10 * 60), func(): async (){ ignore makeContributionsByAllUsersToAllFundingCampaignsForLoans(); });
        });
    };    
};