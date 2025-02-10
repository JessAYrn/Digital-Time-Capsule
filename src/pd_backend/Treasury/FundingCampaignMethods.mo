import TreasuryTypes "types";
import Iter "mo:base/Iter";
import Error "mo:base/Error";
import Account "../Serializers/Account";
import Principal "mo:base/Principal";
import Utils "./Utils";
import NatX "../MotokoNumbers/NatX";
import Buffer "mo:base/Buffer";
import Float "mo:base/Float";
import Time "mo:base/Time";
import Int64 "mo:base/Int64";
import Nat64 "mo:base/Nat64";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Ledger "../NNS/Ledger";
import Timer "mo:base/Timer";
import NeuronMethods "NeuronMethods";

module{

    let txFee: Nat64 = 10_000;

    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    let {setTimer} = Timer;
    
    public func createFundingCampaign({
        newCampaignInput: TreasuryTypes.FundingCampaignInput;
        userPrincipal: Text;
        neuronDataMap: TreasuryTypes.NeuronsDataMap;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        campaignIndex: Nat;
    }) : async () {

        let loanAgreement: ?TreasuryTypes.FundingCampaignLoanAgreement = switch(newCampaignInput.loanAgreement){
            case null { null };
            case (?{paymentTermPeriod; numberOfPayments; loanPrincipal; loanInterest; collateralProvided;}) { 

                if(numberOfPayments == 0) throw Error.reject("Number of payments cannot be 0.");

                let {stake_e8s = userStakedIcp; collateralized_stake_e8s} = NeuronMethods.getUserNeuronStakeInfo(userPrincipal, neuronDataMap, collateralProvided.icp_staked.fromNeuron);
                let userCollateralizedStakedIcp : Nat64 = switch(collateralized_stake_e8s){case (?collateralizedStake) {collateralizedStake}; case (null) {0;}};
                let stakeAvailabletoCollateralize = userStakedIcp - userCollateralizedStakedIcp;
                if (stakeAvailabletoCollateralize < collateralProvided.icp_staked.e8s) throw Error.reject("User has insufficient staked ICP.");
                NeuronMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal; delta = collateralProvided.icp_staked.e8s; neuronId = collateralProvided.icp_staked.fromNeuron; operation = #AddCollateralizedStake});

                let payments: [TreasuryTypes.Payment] = [];
                let collateralReleased = {icp_staked = {e8s: Nat64 = 0; fromNeuron = collateralProvided.icp_staked.fromNeuron}};
                let collateralForfeited = {icp_staked = {e8s: Nat64 = 0; fromNeuron = collateralProvided.icp_staked.fromNeuron}};
            
                ?{ loanPrincipal; loanInterest; collateralProvided; collateralReleased; collateralForfeited; payments; numberOfPayments; paymentTermPeriod};
            };
        };

        fundingCampaignsMap.put(campaignIndex, {
            newCampaignInput with 
            contributions = []; 
            recipient = userPrincipal;
            subaccountId = await Account.getRandomSubaccount(); 
            settled = false;
            funded = false;
            campaignWalletBalance = {icp = {e8s: Nat64 = 0}; }; 
            amountDisbursedToRecipient = {icp = {e8s: Nat64 = 0}; }; 
            loanAgreement;
            terms = null;
        });

    };

    public func cancelFundingCampaign({
        campaignId: Nat;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        neuronDataMap: TreasuryTypes.NeuronsDataMap;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, TreasuryTypes.AccountType) -> async ();
        treasuryCanisterId: Principal;
    }): async TreasuryTypes.FundingCampaignsArray {

        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {funded; campaignWalletBalance; loanAgreement;} = campaign;

        if(funded) throw Error.reject("Funding campaign has already been funded.");

        await distributePayoutsFromFundingCampaign({campaignId; amountRepaid = campaignWalletBalance.icp.e8s; usersTreasuryDataMap; updateTokenBalances; fundingCampaignsMap; treasuryCanisterId});

        let updatedLoanAgreement: ?TreasuryTypes.FundingCampaignLoanAgreement = switch(loanAgreement){
            case null { null }; 
            case (?loanAgreement) { 
                let { collateralProvided; } = loanAgreement;
                NeuronMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = campaign.recipient; delta = collateralProvided.icp_staked.e8s; neuronId = collateralProvided.icp_staked.fromNeuron; operation = #SubtractCollateralizedStake});
                ?{ loanAgreement with collateralReleased = collateralProvided };
            };
        };

        fundingCampaignsMap.put(campaignId, {campaign with loanAgreement = updatedLoanAgreement; settled = true});
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    public func distributePayoutsFromFundingCampaign({
        campaignId: Nat;
        amountRepaid: Nat64;
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ();
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        treasuryCanisterId: Principal;
    }): async (){
        let ?{contributions; subaccountId = campaignSubaccountId;} = fundingCampaignsMap.get(campaignId) else { throw Error.reject("No campaign found") };
        var totalContributions: Nat64 = 0;
        for((_, {icp = contribution}) in Iter.fromArray(contributions)){ totalContributions += contribution.e8s; };
        label distributingPayouts for((userPrincipal, {icp = userCampaignContribution}) in Iter.fromArray(contributions)){
            let amountOwedToUser: Nat64 = NatX.nat64ComputeFractionMultiplication({factor = amountRepaid; numerator = userCampaignContribution.e8s; denominator = totalContributions});
            let ?{subaccountId = userSubaccountId} = usersTreasuryDataMap.get(userPrincipal) else { continue distributingPayouts };
            let paymentFrom = {subaccountId = ?campaignSubaccountId; accountType = #FundingCampaign};
            let paymentTo = {owner = treasuryCanisterId; subaccountId = ?userSubaccountId; accountType = #UserTreasuryData};
            ignore Utils.performTransfer(amountOwedToUser, paymentFrom, paymentTo, updateTokenBalances);
        };
    };

    public func repayFundingCampaign({
        amount: Nat64;
        contributor: TreasuryTypes.PrincipalAsText;
        campaignId: Nat;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        neuronDataMap: TreasuryTypes.NeuronsDataMap; 
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ();
        treasuryCanisterId: Principal;
    }) : async TreasuryTypes.FundingCampaignsArray {

        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");

        let {subaccountId = fundingCampaignSubaccountId; funded; recipient; settled} = campaign;

        let (_, senderSubaccountId) = Utils.getIdAndSubaccount(#Principal(contributor), usersTreasuryDataMap, fundingCampaignsMap);
        let paymentFrom = {subaccountId = ?senderSubaccountId; accountType = #UserTreasuryData};
        let paymentTo = {owner = treasuryCanisterId; subaccountId = ?fundingCampaignSubaccountId; accountType = #FundingCampaign};

        if(not funded) throw Error.reject("Campaign funds have not been disbursed yet.");
        if(settled) throw Error.reject("Campaign has already been settled.");
        let ?loanAgreement = campaign.loanAgreement else throw Error.reject("Campaign loanAgreement not found.");

        let {payments; loanPrincipal; loanInterest; collateralProvided; } = loanAgreement;

        var totalOwed: Nat64 = 0;
        var totalCollateralReleased: Nat64 = 0;
        var totalCollateralForfeited: Nat64 = 0;
        for(({owed; collateralReleased; collateralForfeited}) in Iter.fromArray(payments)){ 
            totalOwed += owed.icp.e8s; 
            totalCollateralReleased += collateralReleased.icp_staked.e8s;
            totalCollateralForfeited += collateralForfeited.icp_staked.e8s;
        };

        let amountToRepay = Nat64.min(amount, totalOwed);
        let {amountSent} = await Utils.performTransfer( amountToRepay, paymentFrom, paymentTo, updateTokenBalances );

        ignore distributePayoutsFromFundingCampaign({campaignId; amountRepaid = amountSent; usersTreasuryDataMap; updateTokenBalances; fundingCampaignsMap; treasuryCanisterId});

        let initialLoanObligation = loanPrincipal.icp.e8s + loanInterest.icp.e8s;

        var remainingPaymentToApplyCreditFor = amountSent;
        var collateralToBeReleased: Nat64 = 0;

        let updatedPaymentsBuffer = Buffer.Buffer<TreasuryTypes.Payment>(0);

        label updatingPayments for((payment) in Iter.fromArray(payments)){
            let {owed; paid; collateralReleased; dueDate;} = payment;

            if(dueDate < Time.now()) {
                updatedPaymentsBuffer.add(payment);
                continue updatingPayments;
            };

            let amountPaid = Nat64.min(owed.icp.e8s, remainingPaymentToApplyCreditFor);
            let updatedAmountOwed = {icp = {e8s = owed.icp.e8s - amountPaid; } };
            let updatedPaid = {icp = {e8s = paid.icp.e8s + amountPaid; } };

            let collateralReleaseAsResultOfAmountPaid = NatX.nat64ComputeFractionMultiplication({factor = collateralProvided.icp_staked.e8s; numerator = amountPaid; denominator = initialLoanObligation});
            let updatedCollateralReleased = {icp_staked = {e8s = collateralReleased.icp_staked.e8s + collateralReleaseAsResultOfAmountPaid; fromNeuron = collateralProvided.icp_staked.fromNeuron; }};

            let updatedPayment = {payment with owed = updatedAmountOwed; paid = updatedPaid; collateralReleased = updatedCollateralReleased;};

            updatedPaymentsBuffer.add(updatedPayment);

            collateralToBeReleased += collateralReleaseAsResultOfAmountPaid;
            remainingPaymentToApplyCreditFor -= amountPaid;
            if(remainingPaymentToApplyCreditFor == 0) break updatingPayments;
        };
        
        let updatedLoanAgreement = {loanAgreement with payments = Buffer.toArray(updatedPaymentsBuffer); };
        
        NeuronMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = recipient; delta = collateralToBeReleased; neuronId = collateralProvided.icp_staked.fromNeuron; operation = #SubtractCollateralizedStake});
        totalCollateralReleased += collateralToBeReleased;

        let settledCollateralRatio = Float.fromInt64(Int64.fromNat64(totalCollateralReleased + totalCollateralForfeited )) / Float.fromInt64(Int64.fromNat64(collateralProvided.icp_staked.e8s)) ;
        let isSettled = settledCollateralRatio >= 0.999;
        if(isSettled) {
            let slippage: Nat64 = if( totalCollateralReleased + totalCollateralForfeited > collateralProvided.icp_staked.e8s) { 0 } else { totalCollateralReleased + totalCollateralForfeited - collateralProvided.icp_staked.e8s };
            NeuronMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = recipient; delta = slippage; neuronId = collateralProvided.icp_staked.fromNeuron; operation = #SubtractCollateralizedStake});
        };
        
        fundingCampaignsMap.put(campaignId, { campaign with settled = isSettled; loanAgreement = ?updatedLoanAgreement;  });   
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    private func disburseCampaignFundingToRecipient({ 
        campaignId: TreasuryTypes.CampaignId; 
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        treasuryCanisterId: Principal;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ()
    }): async () {

        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {campaignWalletBalance; recipient; subaccountId = campaignSubaccountId} = campaign;
        var updatedCampaign = campaign;

        let (_,recipientSubaccountId) = Utils.getIdAndSubaccount(#Principal(recipient), usersTreasuryDataMap, fundingCampaignsMap);
        let paymentFrom = {subaccountId = ?campaignSubaccountId; accountType = #FundingCampaign};
        let paymentTo = {owner = treasuryCanisterId; subaccountId = ?recipientSubaccountId; accountType = #UserTreasuryData};
        let {amountSent} = await Utils.performTransfer(campaignWalletBalance.icp.e8s, paymentFrom, paymentTo, updateTokenBalances);
        
        updatedCampaign := {
            updatedCampaign with funded = true; settled = true;
            campaignWalletBalance = {icp = { e8s = Nat64.fromNat( await ledger.icrc1_balance_of({owner = treasuryCanisterId; subaccount = ?campaignSubaccountId})) }};
            amountDisbursedToRecipient = {icp = {e8s = amountSent}};
        };
        
        let ?loanAgreement_ = updatedCampaign.loanAgreement else { fundingCampaignsMap.put(campaignId, updatedCampaign); return; };

        let {loanPrincipal; loanInterest; collateralProvided; numberOfPayments; paymentTermPeriod} = loanAgreement_;

        let paymentsBuffer = Buffer.Buffer<TreasuryTypes.Payment>(0);
        let totalOwed = loanPrincipal.icp.e8s + loanInterest.icp.e8s;
        let paymentAmount = NatX.nat64ComputeFractionMultiplication({factor = 1; numerator = totalOwed; denominator = numberOfPayments});

        for(i in Iter.range(1, Nat64.toNat(numberOfPayments))){
            let payment : TreasuryTypes.Payment = {
                owed = { icp = {e8s = paymentAmount};};
                paid = {icp = {e8s = 0;}};
                collateralReleased = {icp_staked = {e8s = 0; fromNeuron = collateralProvided.icp_staked.fromNeuron}};
                collateralForfeited = {icp_staked = {e8s = 0; fromNeuron = collateralProvided.icp_staked.fromNeuron}};
                dueDate = Time.now() + i * Nat64.toNat(paymentTermPeriod);
            };
            paymentsBuffer.add(payment);
        };

        fundingCampaignsMap.put(campaignId, {updatedCampaign with settled = false; loanAgreement = ?{loanAgreement_ with payments = Buffer.toArray(paymentsBuffer)}});
    };

    public func disburseEligibleCampaignFundingsToRecipient({
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        treasuryCanisterId: Principal;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ()
    }) : async () {

        label disbursingCampaignFundings for((campaignId, campaign) in fundingCampaignsMap.entries()){
            let {settled; funded; amountToFund; campaignWalletBalance} = campaign;
            if(settled or funded) continue disbursingCampaignFundings;
            if( campaignWalletBalance.icp.e8s >= amountToFund.icp.e8s - (2 * txFee) ){
                ignore disburseCampaignFundingToRecipient({ campaignId; usersTreasuryDataMap; fundingCampaignsMap; treasuryCanisterId; updateTokenBalances });
            };
        };
    };

    private func concludeBillingCycle({
        campaignId: Nat;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        neuronDataMap: TreasuryTypes.NeuronsDataMap;
    }): async () {

        let ?campaign = fundingCampaignsMap.get(campaignId) else return;
        let {recipient; loanAgreement; contributions} = campaign;
        let ?loanAgreement_ = loanAgreement else return;
        let {loanPrincipal; loanInterest; collateralProvided; payments} = loanAgreement_ else return;

        let totalObligation = loanPrincipal.icp.e8s + loanInterest.icp.e8s;
        var collateralForfeitedDuringCurrentCycle: Nat64 = 0;
        var totalCollateralForfeited: Nat64 = 0;
        var totalCollateralReleased: Nat64 = 0;

        let updatedPayments = Buffer.Buffer<TreasuryTypes.Payment>(0);

        label countingCollateral for(payment in Iter.fromArray(payments)){

            totalCollateralReleased += payment.collateralReleased.icp_staked.e8s;
            totalCollateralForfeited += payment.collateralForfeited.icp_staked.e8s;

            if(payment.owed.icp.e8s == 0 or Time.now() < payment.dueDate) {
                updatedPayments.add(payment);
                continue countingCollateral;
            };

            let collateralForfeitedFromThisPayment = NatX.nat64ComputeFractionMultiplication({factor = collateralProvided.icp_staked.e8s; numerator = payment.owed.icp.e8s; denominator = totalObligation});
            collateralForfeitedDuringCurrentCycle += collateralForfeitedFromThisPayment;
            totalCollateralForfeited += collateralForfeitedFromThisPayment;

            updatedPayments.add({payment with owed = {icp = {e8s: Nat64 = 0}}; collateralForfeited = {icp_staked = {e8s = collateralForfeitedFromThisPayment; fromNeuron = collateralProvided.icp_staked.fromNeuron}}});
        };

        NeuronMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = recipient; delta = collateralForfeitedDuringCurrentCycle; neuronId = collateralProvided.icp_staked.fromNeuron; operation = #SubtractCollateralizedStake});
        NeuronMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = recipient; delta = collateralForfeitedDuringCurrentCycle; neuronId = collateralProvided.icp_staked.fromNeuron; operation = #SubtractStake});
        NeuronMethods.redistributeStakeToLoanContributors(collateralForfeitedDuringCurrentCycle, contributions,neuronDataMap, collateralProvided.icp_staked.fromNeuron);
        
        let settledCollateralRatio = Float.fromInt64(Int64.fromNat64(totalCollateralReleased + totalCollateralForfeited )) / Float.fromInt64(Int64.fromNat64(collateralProvided.icp_staked.e8s)) ;
        let isSettled = settledCollateralRatio >= 0.999;
        if(isSettled) {
            let slippage: Nat64 = if( totalCollateralReleased + totalCollateralForfeited > collateralProvided.icp_staked.e8s) { 0 } else { totalCollateralReleased + totalCollateralForfeited - collateralProvided.icp_staked.e8s };
            NeuronMethods.updateUserNeuronContribution(neuronDataMap, {userPrincipal = recipient; delta = slippage; neuronId = collateralProvided.icp_staked.fromNeuron; operation = #SubtractCollateralizedStake});
        };

        fundingCampaignsMap.put(campaignId, { campaign with settled = isSettled; loanAgreement = ?{loanAgreement_ with payments = Buffer.toArray(updatedPayments)}; });
    };

    public func concludeAllEligbileBillingCycles({
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        neuronDataMap: TreasuryTypes.NeuronsDataMap;
    }): async () {

        label concludeEllibleBillingCycles for((campaignId, campaign) in fundingCampaignsMap.entries()){
            let {settled; funded; loanAgreement} = campaign;
            if(settled or not funded or loanAgreement == null) continue concludeEllibleBillingCycles;
            ignore concludeBillingCycle({campaignId; fundingCampaignsMap; neuronDataMap});
        };
    };

    private func creditCampaignContribution({
        contributor: Text;
        campaignId: Nat;
        amount: Nat64;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
    }): () {
        let ?campaign = fundingCampaignsMap.get(campaignId) else { return };
        let contributionsMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.CampaignContributions>(Iter.fromArray(campaign.contributions), Array.size(campaign.contributions), Text.equal, Text.hash);
        let {icp = userIcpCampaignContribution} = switch(contributionsMap.get(contributor)){
            case (?contribution_) { contribution_ };
            case null { { icp = { e8s: Nat64 = 0} } };
        };
        let updatedCampaignContribution = {icp = { e8s = userIcpCampaignContribution.e8s + amount }};
        contributionsMap.put(contributor, updatedCampaignContribution);
        fundingCampaignsMap.put(campaignId, {campaign with contributions = Iter.toArray(contributionsMap.entries());});
    };

    public func contributeToFundingCampaign({
        contributor: TreasuryTypes.PrincipalAsText;
        campaignId: Nat;
        amount: Nat64;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        treasuryCanisterId: Principal;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ();
    }) : async TreasuryTypes.FundingCampaignsArray {

        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {subaccountId = fundingCampaignSubaccountId; funded; campaignWalletBalance; amountToFund} = campaign;
        if(funded or campaignWalletBalance.icp.e8s >= amountToFund.icp.e8s) throw Error.reject("Campaign already funded.");
        let amountRemainingToFund = amountToFund.icp.e8s - campaignWalletBalance.icp.e8s;
        let amountToContribute = Nat64.min(amount, amountRemainingToFund);
        let (_, contributorSubaccountId) = Utils.getIdAndSubaccount(#Principal(contributor), usersTreasuryDataMap, fundingCampaignsMap);
        let {amountSent} = await Utils.performTransfer(amountToContribute + txFee, {subaccountId = ?contributorSubaccountId; accountType = #UserTreasuryData}, {owner = treasuryCanisterId; subaccountId = ?fundingCampaignSubaccountId; accountType = #FundingCampaign}, updateTokenBalances);
        creditCampaignContribution({contributor; campaignId; amount = amountSent; fundingCampaignsMap});
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    private func fundCampaignUsingAvailableLiquidity({
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        treasuryCanisterId: Principal;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ();
        campaignId: Nat;
    }): async () {

        let ?campaign = fundingCampaignsMap.get(campaignId) else return;

        var totalLiquidityAvailableForLoans: Nat64 = 0;
        let usersContributingLiquidityToLoans = Buffer.Buffer<(principal: TreasuryTypes.PrincipalAsText, userTreasuryData: TreasuryTypes.UserTreasuryData)>(0);

        label summingAvailableLiquidityForLoans for((principal, userTreasuryData) in usersTreasuryDataMap.entries()){ 
            let {balances; automaticallyContributeToLoans;} = userTreasuryData;
            let ?isSetToAutomaticallyContributeToLoans = automaticallyContributeToLoans else continue summingAvailableLiquidityForLoans;
            if(isSetToAutomaticallyContributeToLoans) {
                totalLiquidityAvailableForLoans += balances.icp.e8s;
                usersContributingLiquidityToLoans.add((principal, userTreasuryData));
            };
        };

        if(totalLiquidityAvailableForLoans < 100_000_000) return;
 
        let {loanAgreement;} = campaign;
        let ?{loanPrincipal = amountNeededToFundThisLoan;} = loanAgreement else return;

        for((contributor, {balances}) in Iter.fromArray(Buffer.toArray(usersContributingLiquidityToLoans))){ 
            let userLiquidityAvailableForLoans = balances.icp.e8s;
            let liquidityToBeProvidedByThisUser = NatX.nat64ComputeFractionMultiplication({factor = amountNeededToFundThisLoan.icp.e8s; numerator = userLiquidityAvailableForLoans; denominator = totalLiquidityAvailableForLoans});
            ignore contributeToFundingCampaign({contributor; campaignId; amount = liquidityToBeProvidedByThisUser; fundingCampaignsMap; usersTreasuryDataMap; treasuryCanisterId; updateTokenBalances}); 
        };
    };

    public func fundAllAwaitingLoanCampaignsUsingAvailableLiquidity({
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        treasuryCanisterId: Principal;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ();
    }): async () {

        var numberOfCampaignsFunded: Nat = 0;

        label fundingCampaigns for((campaignId, {settled; funded; loanAgreement}) in fundingCampaignsMap.entries()){
            if(settled or funded or loanAgreement == null) continue fundingCampaigns;
            ignore setTimer<system>(#seconds(60 * 5 * numberOfCampaignsFunded), func(): async (){
                ignore fundCampaignUsingAvailableLiquidity({fundingCampaignsMap; usersTreasuryDataMap; treasuryCanisterId; updateTokenBalances; campaignId});
                numberOfCampaignsFunded += 1;
            });
        };
    };

    private func getNextDuePayment({
        userPrincipal: TreasuryTypes.PrincipalAsText;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
    }) : ?{campaignId: Nat; payment: TreasuryTypes.Payment} {

        var nextDuePayment: ?{campaignId: Nat; payment: TreasuryTypes.Payment} = null;

        label searchingThroughFundingCampaigns for((campaignId, {recipient; loanAgreement; settled; funded }) in fundingCampaignsMap.entries()){
            if(settled or not funded or recipient != userPrincipal) continue searchingThroughFundingCampaigns;
            let ?{payments} = loanAgreement else continue searchingThroughFundingCampaigns;
            label searchingForNextDuePayment for(thisPayment in Iter.fromArray(payments)){
                if(Time.now() > thisPayment.dueDate) continue searchingForNextDuePayment;
                let ?{payment = {dueDate = closestDueDate};} = nextDuePayment else {
                    nextDuePayment := ?{campaignId; payment = thisPayment;};
                    continue searchingForNextDuePayment;
                };
                if(thisPayment.dueDate < closestDueDate) nextDuePayment := ?{campaignId; payment = thisPayment;};
            };
        };
        return nextDuePayment;
    };
    

    public func makeAllDuePaymentsByAllUsers({
        usersTreasuryDataMap: TreasuryTypes.UsersTreasuryDataMap;
        fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap;
        treasuryCanisterId: Principal;
        neuronDataMap: TreasuryTypes.NeuronsDataMap;
        updateTokenBalances: shared ( TreasuryTypes.Identifier, TreasuryTypes.SupportedCurrencies, accountType: TreasuryTypes.AccountType  ) -> async ();
    }): async (){
        label makingPayments for((userPrincipal, {automaticallyRepayLoans; balances}) in usersTreasuryDataMap.entries()){ 
            let ?autoRepayIsEnabled = automaticallyRepayLoans else continue makingPayments;
            if(autoRepayIsEnabled) {
                let ?{campaignId; payment;} = getNextDuePayment({userPrincipal; fundingCampaignsMap}) else continue makingPayments;
                let amountToRepay = Nat64.min(payment.owed.icp.e8s, balances.icp.e8s);
                ignore repayFundingCampaign({contributor = userPrincipal; campaignId; amount = amountToRepay; fundingCampaignsMap; usersTreasuryDataMap; treasuryCanisterId; updateTokenBalances; neuronDataMap});
            };
        };
    };

    public func getTotalDebtsByUser(userPrincipal: TreasuryTypes.PrincipalAsText, fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap): {totalDebtsOwed: Nat64; totalDebtsDue: Nat64;} {
        var totalDebtsOwed: Nat64 = 0;
        var totalDebtsDue: Nat64 = 0;
        label summingDebtsOwed for((campaignId, campaign) in fundingCampaignsMap.entries()){
            let {recipient; terms; settled; funded;} = campaign;
            if(settled or not funded) continue summingDebtsOwed;
            if(recipient != userPrincipal) continue summingDebtsOwed;
            let ?terms_ = terms else continue summingDebtsOwed;
            let { remainingLoanPrincipalAmount; remainingLoanInterestAmount; paymentAmounts; amountRepaidDuringCurrentPaymentInterval } = terms_;
            totalDebtsOwed += remainingLoanPrincipalAmount.icp.e8s + remainingLoanInterestAmount.icp.e8s;
            totalDebtsDue += switch(paymentAmounts.icp.e8s > amountRepaidDuringCurrentPaymentInterval.icp.e8s){
                case true { paymentAmounts.icp.e8s - amountRepaidDuringCurrentPaymentInterval.icp.e8s; };
                case false { 0; };
            };
        };
        return {totalDebtsOwed; totalDebtsDue};
    };

    public func getTotalDebts(fundingCampaignMap: TreasuryTypes.FundingCampaignsMap): {totalDebts: Nat64} {
        var totalDebts: Nat64 = 0;
        label summingDebts for((_, campaign) in fundingCampaignMap.entries()){
            let {terms; settled; funded;} = campaign;
            if(settled or not funded) continue summingDebts;
            let ?terms_ = terms else continue summingDebts;
            let {remainingLoanPrincipalAmount; remainingLoanInterestAmount } = terms_;
            totalDebts += remainingLoanPrincipalAmount.icp.e8s + remainingLoanInterestAmount.icp.e8s;
        };
        return {totalDebts};
    };
};