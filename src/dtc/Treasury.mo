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
import Hex "Serializers/Hex";
import Debug "mo:base/Debug";
import AnalyticsTypes "Types/Analytics/types";
import AsyncronousHelperMethods "Modules/Treasury/AsyncronousHelperMethods";
import SyncronousHelperMethods "Modules/Treasury/SyncronousHelperMethods";

shared actor class Treasury (principal : Principal) = this {

    private stable var selfAuthenticatingPrincipal : ?Principal = null;
    private stable var public_key : ?Blob = null;
    private stable let ownerCanisterId : Text = Principal.toText(principal);
    private stable var sumOfAllTokenBalances : AnalyticsTypes.Balances = { icp = {e8s = 0}; icp_staked = {e8s = 0}; eth = {e8s = 0}; btc = {e8s = 0}; };
    private stable var actionLogsArray : TreasuryTypes.ActionLogsArray = [];
    private var actionLogsMap : TreasuryTypes.ActionLogsMap = HashMap.HashMap<Text, Text>(1, Text.equal, Text.hash);
    private stable var pendingActionsArray : TreasuryTypes.PendingActionArray = [];
    private var pendingActionsMap : TreasuryTypes.PendingActionsMap = HashMap.fromIter<Text, TreasuryTypes.PendingAction>( Iter.fromArray(pendingActionsArray), Iter.size(Iter.fromArray(pendingActionsArray)), Text.equal, Text.hash );
    private stable var usersTreasuryDataArray : TreasuryTypes.UsersTreasuryDataArray = [];
    private var usersTreasuryDataMap : TreasuryTypes.UsersTreasuryDataMap = HashMap.fromIter<TreasuryTypes.PrincipalAsText, TreasuryTypes.UserTreasuryData>(Iter.fromArray(usersTreasuryDataArray), Iter.size(Iter.fromArray(usersTreasuryDataArray)), Text.equal, Text.hash);
    private stable var subaccountRegistryArray : TreasuryTypes.SubaccountRegistryArray = [];
    private var subaccountRegistryMap : TreasuryTypes.SubaccountRegistryMap = HashMap.fromIter<Blob, TreasuryTypes.SubaccountsMetaData>( Iter.fromArray(subaccountRegistryArray), Iter.size(Iter.fromArray(subaccountRegistryArray)), Blob.equal, Blob.hash );
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

    let {recurringTimer; setTimer} = Timer;

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

    private func createTreasuryData_(principal: Principal) : async () {
        var newSubaccount: Account.Subaccount = Account.defaultSubaccount();
        if(not Principal.equal(principal, Principal.fromActor(this))){
            newSubaccount := await Account.getRandomSubaccount();
            while(subaccountRegistryMap.get(newSubaccount) != null){ newSubaccount := await Account.getRandomSubaccount(); };
        };

        subaccountRegistryMap.put(newSubaccount, {owner = Principal.toText(principal)});
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
        let userTreasuryData = switch(usersTreasuryDataMap.get(userPrincipalAsText)){
            case (?userTreasuryData) { userTreasuryData };
            case (null) { throw Error.reject("User not found."); };
        };
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

    public shared func getNeuronSubAccountId(): async Text {
        let {selfAuthPrincipal} = getSelfAuthenticatingPrincipalAndPublicKey_();
        let treasuryNeuronSubaccount = Account.neuronSubaccount(selfAuthPrincipal, 0);
        Hex.encode(Blob.toArray(treasuryNeuronSubaccount));
    };

    public shared({caller}) func createNeuron({amount: Nat64; contributor: Principal}) : async Result.Result<(), TreasuryTypes.Error> {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        actionLogsMap.put(Int.toText(Time.now()),"Creating Neuron, amount: " # Nat64.toText(amount) # ", contributor: " # Principal.toText(contributor));
        let {selfAuthPrincipal; publicKey} = getSelfAuthenticatingPrincipalAndPublicKey_();
        let response = await AsyncronousHelperMethods.createNeuron(
            neuronDataMap,
            usersTreasuryDataMap,
            pendingActionsMap,
            actionLogsMap,
            memoToNeuronIdMap,
            updateTokenBalances,
            transformFn,
            {amount; contributor; neuronMemo; selfAuthPrincipal; publicKey; },
        );
        switch(response){
            case(#ok()) { 
                neuronMemo += 1; 
                return #ok(()); 
            };
            case(#err(#TxFailed)) {
                actionLogsMap.put(Int.toText(Time.now()),"Error creating neuron: Transaction failed.");
                throw Error.reject("Error creating neuron.");
            };
            case(#err(#InsufficientFunds)) {
                actionLogsMap.put(Int.toText(Time.now()),"Error creating neuron: Contributor has insufficient funds.");
                throw Error.reject("Error creating neuron.");
            };
            case(#err(_)) { neuronMemo += 1; throw Error.reject("Error Refreshing Neuron."); };
        };
    };

    public shared({caller}) func increaseNeuron({amount: Nat64; neuronId: Nat64; contributor: Principal}) : async Result.Result<() , TreasuryTypes.Error>{
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let {selfAuthPrincipal; publicKey} = getSelfAuthenticatingPrincipalAndPublicKey_();
        let response = await AsyncronousHelperMethods.increaseNeuron(
            neuronDataMap,
            usersTreasuryDataMap,
            pendingActionsMap,
            actionLogsMap,
            memoToNeuronIdMap,
            updateTokenBalances,
            transformFn,
            {amount; neuronId; contributor; selfAuthPrincipal; publicKey;}
        );
        switch(response){
            case(#ok()) return #ok(());
            case(#err(#TxFailed)) {
                actionLogsMap.put(Int.toText(Time.now()),"Error increasing neuron: Transaction failed.");
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
            actionLogsMap,
            memoToNeuronIdMap,
            updateTokenBalances,
            transformFn,
            args,
            proposer,
            Principal.fromActor(this),
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

    public query({caller}) func viewPendingActions() : async TreasuryTypes.PendingActionArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(pendingActionsMap.entries());
    };

    public query({caller}) func viewActivityLogs() : async TreasuryTypes.ActionLogsArray {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        return Iter.toArray(actionLogsMap.entries());
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
        let (userPrincipal, subaccountID) = SyncronousHelperMethods.getPrincipalAndSubaccount(identifier, subaccountRegistryMap, usersTreasuryDataMap);
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

    public shared({caller}) func resolvePendingActions() : async () {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        await AsyncronousHelperMethods.resolvePendingActions(
            neuronDataMap,
            usersTreasuryDataMap,
            pendingActionsMap,
            actionLogsMap,
            memoToNeuronIdMap,
            updateTokenBalances,
            transformFn
        );
    };

    public shared({caller}) func transferICP(
        amount: Nat64, 
        sender: TreasuryTypes.Identifier,
        recipient: Principal
    ) : async {blockIndex: Nat} {
        if(Principal.toText(caller) != Principal.toText(Principal.fromActor(this)) and Principal.toText(caller) != ownerCanisterId ) throw Error.reject("Unauthorized access.");
        let (sourcePrincipal, _) = SyncronousHelperMethods.getPrincipalAndSubaccount(sender, subaccountRegistryMap, usersTreasuryDataMap);
        let ?{subaccountId = sendersubaccountId} = usersTreasuryDataMap.get(sourcePrincipal) else throw Error.reject("Sender not found."); 

        let res = await ledger.icrc1_transfer({
            to = { owner = recipient; subaccount = null };
            fee = ?Nat64.toNat(txFee);
            memo = null;
            from_subaccount = ?sendersubaccountId;
            created_at_time =?Nat64.fromNat(Int.abs(Time.now()));
            amount = Nat64.toNat(amount - txFee);
        });

        switch (res) {
            case (#Ok(blockIndex)) {
                Debug.print("Paid reward to " # debug_show Principal.fromActor(this) # " in block " # debug_show blockIndex);
                return {blockIndex};
            };
            case (#Err(#InsufficientFunds { balance })) {
                throw Error.reject("Top me up! The balance is only " # debug_show balance # " e8s");    
            };
            case (#Err(other)) {
                throw Error.reject("Unexpected error: " # debug_show other);
            };
        };
    };

    system func preupgrade() { 
        usersTreasuryDataArray := Iter.toArray(usersTreasuryDataMap.entries()); 
        balancesHistoryArray := Iter.toArray(balancesHistoryMap.entries());
        neuronDataArray := Iter.toArray(neuronDataMap.entries());
        memoToNeuronIdArray := Iter.toArray(memoToNeuronIdMap.entries());
        pendingActionsArray := Iter.toArray(pendingActionsMap.entries());
        actionLogsArray := Iter.toArray(actionLogsMap.entries());
        subaccountRegistryArray := Iter.toArray(subaccountRegistryMap.entries());
    };

    system func postupgrade() { 
        usersTreasuryDataArray:= []; 
        balancesHistoryArray := [];
        neuronDataArray := [];
        memoToNeuronIdArray := [];
        pendingActionsArray := [];
        actionLogsArray := [];
        subaccountRegistryArray := [];

        ignore setTimer<system>(#nanoseconds(1), func (): async () {
            await populateSelfAuthenticatingPrincipalAndPublicKey();
        });

        ignore recurringTimer<system>(#seconds(24 * 60 * 60), func (): async () { 
            let {selfAuthPrincipal; publicKey} = getSelfAuthenticatingPrincipalAndPublicKey_();
            await AsyncronousHelperMethods.refreshNeuronsData(
                neuronDataMap,
                usersTreasuryDataMap,
                pendingActionsMap,
                actionLogsMap,
                memoToNeuronIdMap,
                updateTokenBalances,
                transformFn,
                selfAuthPrincipal,
                publicKey
            )
        });
    };    
};