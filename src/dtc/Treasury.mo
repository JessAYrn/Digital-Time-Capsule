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
import EcdsaHelperMethods "Modules/ECDSA/ECDSAHelperMethods";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import AnalyticsTypes "Types/Analytics/types";
import AsyncronousHelperMethods "Modules/Treasury/AsyncronousHelperMethods";
import SyncronousHelperMethods "Modules/Treasury/SyncronousHelperMethods";

shared actor class Treasury (principal : Principal) = this {

    private stable var selfAuthenticatingPrincipal : ?Principal = null;
    private stable var public_key : ?Blob = null;
    private stable let ownerCanisterId : Text = Principal.toText(principal);
    private stable var sumOfAllTokenBalances : AnalyticsTypes.Balances = { icp = {e8s = 0}; icp_staked = {e8s = 0}; eth = {e8s = 0}; btc = {e8s = 0}; };
    private stable var actionLogsArray : TreasuryTypes.ActionLogsArray = [];
    private var actionLogsArrayBuffer : Buffer.Buffer<(Text, Text)> = Buffer.Buffer<(Text, Text)>(1); 
    private stable var pendingActionsArray : TreasuryTypes.PendingActionArray = [];
    private var pendingActionsMap : TreasuryTypes.PendingActionsMap = HashMap.fromIter<Text, TreasuryTypes.PendingAction>( Iter.fromArray(pendingActionsArray), Iter.size(Iter.fromArray(pendingActionsArray)), Text.equal, Text.hash );
    private stable var usersTreasuryDataArray : TreasuryTypes.UsersTreasuryDataArray = [];
    private var usersTreasuryDataMap : TreasuryTypes.UsersTreasuryDataMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryData>(Iter.fromArray(usersTreasuryDataArray), Iter.size(Iter.fromArray(usersTreasuryDataArray)), Text.equal, Text.hash);
    private stable var balancesHistoryArray : AnalyticsTypes.BalancesArray = [];
    private var balancesHistoryMap : AnalyticsTypes.BalancesMap = HashMap.fromIter<Text, AnalyticsTypes.Balances>(Iter.fromArray(balancesHistoryArray), Iter.size(Iter.fromArray(balancesHistoryArray)), Text.equal, Text.hash);
    private stable var memoToNeuronIdArray : TreasuryTypes.MemoToNeuronIdArray = [];
    private var memoToNeuronIdMap : TreasuryTypes.MemoToNeuronIdMap = HashMap.fromIter<TreasuryTypes.Memo, TreasuryTypes.NeuronId>(Iter.fromArray(memoToNeuronIdArray), Iter.size(Iter.fromArray(memoToNeuronIdArray)), Nat.equal, Hash.hash);
    private stable var neuronDataArray : TreasuryTypes.NeuronsDataArray = [];
    private var neuronDataMap : TreasuryTypes.NeuronsDataMap = HashMap.fromIter<TreasuryTypes.NeuronIdAsText, TreasuryTypes.NeuronData>(Iter.fromArray(neuronDataArray), Iter.size(Iter.fromArray(neuronDataArray)), Text.equal, Text.hash);
    private var capacity = 1000000000000;
    private let txFee : Nat64 = 10_000;
    private let ledger : Ledger.Interface  = actor(Ledger.CANISTER_ID);
    private stable var neuronMemo : Nat64 = 0;
    private stable var fundingCampaignsArray : TreasuryTypes.FundingCampaignsArray = [];
    private var fundingCampaignsMap: TreasuryTypes.FundingCampaignsMap = HashMap.fromIter<TreasuryTypes.CampaignId, TreasuryTypes.FundingCampaign>(Iter.fromArray(fundingCampaignsArray), Iter.size(Iter.fromArray(fundingCampaignsArray)), Nat.equal, Hash.hash);
    private stable var campaignIndex : Nat = 0;

    let {recurringTimer; setTimer} = Timer;

    public shared({caller}) func createFundingCampaign(campaign: TreasuryTypes.FundingCampaignInput) : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        var totalAllocation: Nat = campaign.percentageOfDaoRewardsAllocated;
        label loop_ for((campaignId_, {percentageOfDaoRewardsAllocated; finalized}) in fundingCampaignsMap.entries()){
            if(finalized) continue loop_; 
            totalAllocation += percentageOfDaoRewardsAllocated; 
        };
        if(totalAllocation > 100) throw Error.reject("Allocation percentage cannot be greater than 100.");
        fundingCampaignsMap.put(campaignIndex, {
            campaign with contributions = []; subaccountId = await getUnusedSubaccountId(); finalized = false; 
            balances = { icp = { e8s: Nat64 = 0}}; 
            amountDisbursed = {icp = { e8s: Nat64 = 0}}; 
            amountRepaid = {icp = { e8s: Nat64 = 0}};
            amountOwed = { icp = { e8s: Nat64 = 0}};
        } );
        campaignIndex += 1;
    };

    public query({caller}) func getFundingCampainsArray() : async TreasuryTypes.FundingCampaignsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(fundingCampaignsMap.entries());
    };

    public shared({caller}) func contributeToFundingCampaign(contributor: TreasuryTypes.PrincipalAsText, campaignId: Nat, amount: Nat64) 
    : async TreasuryTypes.FundingCampaignsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
        let {subaccountId = fundingCampaignSubaccountId} = campaign;
        let {amountSent} = await transferICP(amount, #Principal(contributor), {recipient = Principal.fromActor(this); subaccount = ?fundingCampaignSubaccountId});
        await AsyncronousHelperMethods.creditCampaignContribution(contributor, campaignId, amountSent, fundingCampaignsMap, Principal.fromActor(this));
        return Iter.toArray(fundingCampaignsMap.entries());
    };
    // complete this function
    // public shared({caller}) func repayFundingCampaign(campaignId: Nat, amount: Nat64) : async TreasuryTypes.FundingCampaignsArray {
    //     if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
    //     let ?campaign = fundingCampaignsMap.get(campaignId) else throw Error.reject("Campaign not found.");
    //     let {subaccountId = fundingCampaignSubaccountId} = campaign;
    //     let {amountSent} = await transferICP(amount, Principal.fromActor(this), {recipient = Principal.fromActor(this); subaccount = ?fundingCampaignSubaccountId});
    //     await AsyncronousHelperMethods.repayCampaignLoan(campaignId, amountSent, fundingCampaignsMap, Principal.fromActor(this));
    //     return Iter.toArray(fundingCampaignsMap.entries());
    // };

    // change this function to finalize the campaign if the amountRepaid is greater than or equal to the amountOwed
    private func finalizeFundingCampaign(campaignId: TreasuryTypes.CampaignId) : () {
        let ?campaign = fundingCampaignsMap.get(campaignId) else { return };
        if(campaign.finalized) return;
        if(campaign.balances.icp.e8s > campaign.goal.icp.e8s) fundingCampaignsMap.put(campaignId, {campaign with finalized = true});
    };

    private func getSelfAuthenticatingPrincipalAndPublicKey_(): {selfAuthPrincipal: Principal; publicKey: Blob;} {
        let ?publicKey = public_key else { Debug.trap("Public key not populated."); };
        let ?selfAuthPrincipal = selfAuthenticatingPrincipal else Debug.trap("Self authenticating principal not populated.");
        return {selfAuthPrincipal; publicKey};
    };

    public query({caller}) func getSelfAuthenticatingPrincipalAndPublicKey(): async {selfAuthPrincipal: Principal; publicKey: Blob;} {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        getSelfAuthenticatingPrincipalAndPublicKey_();
    };

    public shared({caller}) func populateSelfAuthenticatingPrincipalAndPublicKey(): async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let {public_key = publicKey} = await EcdsaHelperMethods.getPublicKey(null);
        let {principalAsBlob} = Account.getSelfAuthenticatingPrincipal(publicKey);
        public_key := ?publicKey;
        selfAuthenticatingPrincipal := ?Principal.fromBlob(principalAsBlob);
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
        let newSubaccount = switch(Principal.equal(principal, Principal.fromActor(this))){
            case true { Account.defaultSubaccount();};
            case false { await getUnusedSubaccountId(); };
        };
        let newUserTreasuryData = {
            balances = {
                icp = {e8s: Nat64 = 0};
                icp_staked = {e8s: Nat64 = 0};
                eth = {e8s: Nat64 = 0};
                btc = {e8s: Nat64 = 0};
            };
            subaccountId = newSubaccount;
        };
        usersTreasuryDataMap.put(Principal.toText(principal), newUserTreasuryData);
    };

    public shared({caller}) func createTreasuryData(principal: Principal) : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let principalAsText = Principal.toText(principal);
        if(usersTreasuryDataMap.get(principalAsText) != null) throw Error.reject("User already has treasury data.");
        await createTreasuryData_(principal);
    };
    
    // revised to conform to new data structure
    public query({caller}) func getUsersTreasuryDataArray(): async TreasuryTypes.UsersTreasuryDataArrayExport {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let usersDataExport = Iter.map<
            (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryData),
            (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryDataExport)
        >(
            usersTreasuryDataMap.entries(),
            func((userPrincipal, userTreasuryData): (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryData)): (TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryDataExport) {
                let {balances} = userTreasuryData;
                let {icp_staked; voting_power} = SyncronousHelperMethods.computeTotalStakeDepositAndVotingPower(neuronDataMap, userPrincipal);
                return (userPrincipal, {userTreasuryData with balances = {balances with icp_staked; voting_power}} );          
            }
        );
        return Iter.toArray(usersDataExport);
    };
    
    public query({caller}) func getUserTreasuryData(userPrincipal: Principal): async TreasuryTypes.UserTreasuryDataExport {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let userPrincipalAsText = Principal.toText(userPrincipal);
        let userTreasuryData = switch(usersTreasuryDataMap.get(userPrincipalAsText)){ case (?userTreasuryData) { userTreasuryData }; case (null) { throw Error.reject("User not found."); }; };
        let {icp_staked; voting_power} = SyncronousHelperMethods.computeTotalStakeDepositAndVotingPower(neuronDataMap, userPrincipalAsText);
        return {userTreasuryData with balances = {userTreasuryData.balances with icp_staked; voting_power}};
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

    public shared({caller}) func createNeuron({amount: Nat64; contributor: Principal}) : async Result.Result<({amountSent: Nat64}), TreasuryTypes.Error> {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        actionLogsArrayBuffer.add(Int.toText(Time.now()),"Creating Neuron, amount: " # Nat64.toText(amount) # ", contributor: " # Principal.toText(contributor));
        let {selfAuthPrincipal; publicKey} = getSelfAuthenticatingPrincipalAndPublicKey_();
        let response = try { await AsyncronousHelperMethods.createNeuron(
            neuronDataMap,
            usersTreasuryDataMap,
            pendingActionsMap,
            actionLogsArrayBuffer,
            memoToNeuronIdMap,
            updateTokenBalances,
            fundingCampaignsMap,
            transformFn,
            {amount; contributor; neuronMemo; selfAuthPrincipal; publicKey; },
        ); } catch (e) { 
            actionLogsArrayBuffer.add(Int.toText(Time.now()),"Error creating neuron: " # Error.message(e)); 
            throw Error.reject("Error creating neuron.");   
        };
        switch(response){
            case(#ok({amountSent})) { 
                neuronMemo += 1; 
                return #ok({amountSent}); 
            };
            case(#err(#TxFailed)) {
                actionLogsArrayBuffer.add(Int.toText(Time.now()),"Error creating neuron: Transaction failed.");
                throw Error.reject("Error creating neuron.");
            };
            case(#err(#InsufficientFunds)) {
                actionLogsArrayBuffer.add(Int.toText(Time.now()),"Error creating neuron: Contributor has insufficient funds.");
                throw Error.reject("Error creating neuron.");
            };
            case(#err(_)) { neuronMemo += 1; throw Error.reject("Error Refreshing Neuron."); };
        };
    };

    public shared({caller}) func increaseNeuron({amount: Nat64; neuronId: Nat64; contributor: Principal}) : async Result.Result<({amountSent: Nat64}) , TreasuryTypes.Error>{
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let {selfAuthPrincipal; publicKey} = getSelfAuthenticatingPrincipalAndPublicKey_();
        let response = try { await AsyncronousHelperMethods.increaseNeuron(
            neuronDataMap,
            usersTreasuryDataMap,
            pendingActionsMap,
            actionLogsArrayBuffer,
            memoToNeuronIdMap,
            updateTokenBalances,
            fundingCampaignsMap,
            transformFn,
            {amount; neuronId; contributor; selfAuthPrincipal; publicKey;}
        ); } catch (e) { 
            actionLogsArrayBuffer.add(Int.toText(Time.now()),"Error creating neuron: " # Error.message(e)); 
            throw Error.reject("Error creating neuron.");   
        };
        switch(response){
            case(#ok({amountSent})) return #ok({amountSent});
            case(#err(#TxFailed)) {
                actionLogsArrayBuffer.add(Int.toText(Time.now()),"Error increasing neuron: Transaction failed.");
                throw Error.reject("Error increasing neuron.");
            };
            case(#err(_)) { throw Error.reject("Error increasing neuron."); };
        };
    };

    public shared({caller}) func manageNeuron( args: Governance.ManageNeuron, proposer: Principal): async Result.Result<() , TreasuryTypes.Error>{
        let canisterId =  Principal.fromActor(this);
        if(Principal.toText(caller) != Principal.toText(canisterId) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let {selfAuthPrincipal; publicKey} = getSelfAuthenticatingPrincipalAndPublicKey_();
        let response = await AsyncronousHelperMethods.manageNeuron(
            neuronDataMap,
            usersTreasuryDataMap,
            pendingActionsMap,
            actionLogsArrayBuffer,
            memoToNeuronIdMap,
            updateTokenBalances,
            fundingCampaignsMap,
            transformFn,
            args,
            ?proposer,
            ?Principal.fromActor(this),
            selfAuthPrincipal,
            publicKey
        );
        switch(response){
            case(#ok()) return #ok(());
            case(#err(_)) { throw Error.reject("Error managing neuron.") };
        };
    };

    public query({caller}) func getNeuronsDataArray() : async TreasuryTypes.NeuronsDataArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(neuronDataMap.entries());
    };

    public shared({caller}) func refreshNeuronsData() : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let {selfAuthPrincipal; publicKey} = getSelfAuthenticatingPrincipalAndPublicKey_();
        await AsyncronousHelperMethods.refreshNeuronsData(
            neuronDataMap,
            usersTreasuryDataMap,
            pendingActionsMap,
            actionLogsArrayBuffer,
            memoToNeuronIdMap,
            updateTokenBalances,
            fundingCampaignsMap,
            transformFn,
            selfAuthPrincipal,
            publicKey
        );
    };

    public query({caller}) func viewPendingActions() : async TreasuryTypes.PendingActionArrayExport {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let ArrayBuffer = Buffer.Buffer<(Text,TreasuryTypes.PendingActionExport)>(1);
        for((key, {function; expectedHttpResponseType}) in pendingActionsMap.entries()){ 
            let pendingActionExport: TreasuryTypes.PendingActionExport = switch(function){
                case(#GetNeuronData{input}) { #GetNeuronData({args = input.args}) };
                case(#ManageNeuron{input}) { #ManageNeuron({args = input.args }); };
            };
            ArrayBuffer.add((key, pendingActionExport)); 
        };
        return Buffer.toArray(ArrayBuffer);
    };

    public query({caller}) func viewActivityLogs() : async TreasuryTypes.ActionLogsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Buffer.toArray(actionLogsArrayBuffer);
    };

    public shared({caller}) func clearPendingActions() : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        pendingActionsMap := HashMap.HashMap<Text, TreasuryTypes.PendingAction>(1, Text.equal, Text.hash);
    };

    // need to revise this to retrieve the balance of a given subaccount or principal
    public query({caller}) func daoWalletIcpBalance() : async Ledger.ICP {
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(caller) !=  Principal.toText(canisterId)
            and Principal.toText(caller) != ownerCanisterId
        ) { throw Error.reject("Unauthorized access."); };
        let ?treasuryData = usersTreasuryDataMap.get(Principal.toText(Principal.fromActor(this))) else throw Error.reject("User not found.");
        return treasuryData.balances.icp;
    };
    
    public shared({caller}) func updateTokenBalances( identifier: TreasuryTypes.Identifier, currency: TreasuryTypes.SupportedCurrencies) 
    : async () {
        if( Principal.toText(caller) !=  Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) { throw Error.reject("Unauthorized access."); };
        let (userPrincipal, subaccountID) = SyncronousHelperMethods.getPrincipalAndSubaccount(identifier, usersTreasuryDataMap);
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
        let {totalStake} = await getDaoTotalStakeAndVotingPower();
        var icp_e8s: Nat64 = 0;

        label loop_ for((principal, treasuryData) in usersTreasuryDataMap.entries()){
            icp_e8s += treasuryData.balances.icp.e8s;
        };

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
        let limit : Nat = capacity - Cycles.balance();
        let accepted = 
            if (amount <= limit) amount
            else limit;
        let deposit = Cycles.accept<system>(accepted);
        assert (deposit == accepted);
        { accepted = Nat64.fromNat(accepted) };
    };

    public query func transformFn({ response : IC.http_response; }) : async IC.http_response {
        let transformed : IC.http_response = {
            status = response.status;
            body = response.body;
            headers = [];
        };
        transformed;
    };

    public shared({caller}) func resolvePendingAction() : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        await AsyncronousHelperMethods.resolvePendingActionFromQueue(
            neuronDataMap,
            usersTreasuryDataMap,
            pendingActionsMap,
            actionLogsArrayBuffer,
            memoToNeuronIdMap,
            updateTokenBalances,
            fundingCampaignsMap,
            transformFn
        );
    };

    public shared({caller}) func transferICP(
        amount: Nat64, 
        sender: TreasuryTypes.Identifier,
        {recipient: Principal; subaccount: ?Account.Subaccount}
    ) : async {amountSent: Nat64} {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        if(amount < txFee){ return {amountSent: Nat64 = 0}; };
        let (sourcePrincipal, _) = SyncronousHelperMethods.getPrincipalAndSubaccount(sender, usersTreasuryDataMap);
        let ?{subaccountId = sendersubaccountId} = usersTreasuryDataMap.get(sourcePrincipal) else throw Error.reject("Sender not found."); 
        var amountSent = Nat64.toNat(amount - txFee);
        var transferInput = {
            to = { owner = recipient; subaccount; };
            fee = ?Nat64.toNat(txFee);
            memo = null;
            from_subaccount = ?sendersubaccountId;
            created_at_time =?Nat64.fromNat(Int.abs(Time.now()));
            amount = amountSent;
        };

        let res = await ledger.icrc1_transfer(transferInput);

        switch (res) {
            case (#Ok(_)) { 
                ignore updateTokenBalances(sender, #Icp);
                return {amountSent = Nat64.fromNat(amountSent)}; 
            };
            case (#Err(#InsufficientFunds { balance })) {
                if(balance < Nat64.toNat(txFee)){ return {amountSent: Nat64 = 0}; };
                amountSent := balance - Nat64.toNat(txFee);
                let res = await ledger.icrc1_transfer({transferInput with amountSent});
                switch(res){
                    case (#Ok(_)) { 
                        ignore updateTokenBalances(sender, #Icp);
                        return {amountSent = Nat64.fromNat(amountSent)} 
                    };
                    case (#Err(_)) { return {amountSent: Nat64 = 0} };
                };
            };
            case (#Err(_)) { return {amountSent: Nat64 = 0} };
        }; 
    };

    system func preupgrade() { 
        usersTreasuryDataArray := Iter.toArray(usersTreasuryDataMap.entries()); 
        balancesHistoryArray := Iter.toArray(balancesHistoryMap.entries());
        neuronDataArray := Iter.toArray(neuronDataMap.entries());
        memoToNeuronIdArray := Iter.toArray(memoToNeuronIdMap.entries());
        actionLogsArray := Buffer.toArray(actionLogsArrayBuffer);
        fundingCampaignsArray := Iter.toArray(fundingCampaignsMap.entries());
    };

    system func postupgrade() { 
        usersTreasuryDataArray:= []; 
        balancesHistoryArray := [];
        neuronDataArray := [];
        memoToNeuronIdArray := [];
        actionLogsArray := [];
        fundingCampaignsArray := [];

        ignore setTimer<system>(#nanoseconds(1), func (): async () {
            await populateSelfAuthenticatingPrincipalAndPublicKey();
        });

        ignore recurringTimer<system>(#seconds(24 * 60 * 60), func (): async () { 
            let {selfAuthPrincipal; publicKey} = getSelfAuthenticatingPrincipalAndPublicKey_();
            ignore AsyncronousHelperMethods.refreshNeuronsData(
                neuronDataMap,
                usersTreasuryDataMap,
                pendingActionsMap,
                actionLogsArrayBuffer,
                memoToNeuronIdMap,
                updateTokenBalances,
                fundingCampaignsMap,
                transformFn,
                selfAuthPrincipal,
                publicKey
            );

            for((campaignId, _) in fundingCampaignsMap.entries()){ finalizeFundingCampaign(campaignId); };
        });
    };    
};