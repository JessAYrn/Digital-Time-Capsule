import Ledger "../Ledger/Ledger";
import LedgerCandid "../Ledger/LedgerCandid";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Trie "mo:base/Trie";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Account "../Ledger/Account";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import IC "../IC/ic.types";
import AssetCanister "../AssetCanister/AssetCanister";
import WasmStore "WasmStore";
import HashMap "mo:base/HashMap";
import MainTypes "../Main/types";
import CanisterManagementMethods "CanisterManagementMethods";
import AssetManagementFunctions "../AssetCanister/AssetManagementFunctions";
import JournalTypes "../Journal/journal.types";

shared(msg) actor class Manager (principal : Principal) = this {

    private let ic : IC.Self = actor "aaaaa-aa";

    private stable var version : Nat = 0;

    private stable var mainCanisterId : Text = Principal.toText(principal); 

    private var capacity = 1000000000000;

    private let oneICP : Nat64 = 100_000_000;

    private let dummyPrincipal : Principal = Principal.fromText("2vxsx-fae");

    private let dummyBlob = Principal.toBlob(dummyPrincipal);

    private stable var permitUpdateToBackend = false;

    private let dummyWasmData : WasmStore.WasmData = {
        dev = dummyPrincipal;
        wasmModule = dummyBlob;
    };

    private stable var release : WasmStore.Release = {
        assets = [];
        frontend = dummyWasmData;
        backend = dummyWasmData;
        backend_without_timer = dummyWasmData;
        journal = dummyWasmData;
        manager = dummyWasmData;
        treasury = dummyWasmData;
    };

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public shared({caller}) func wallet_balance() : async Nat {
        if( Principal.toText(caller) != mainCanisterId ) { throw Error.reject("Unauthorized access."); };
        return Cycles.balance()
    };

    public shared({caller}) func loadNextRelease(): async () {
        if( Principal.toText(caller) != mainCanisterId) { throw Error.reject("Unauthorized access.");};
        try{
            let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
            var nextStableReleaseIndex = await wasmStore.getNextStableRelease(version);
            if(version == 0) nextStableReleaseIndex := await wasmStore.getLastestStableRelease();
            let updatedRelease_1 = await CanisterManagementMethods.loadModules(nextStableReleaseIndex,release);
            let updatedRelease_2 = await CanisterManagementMethods.loadAssets(nextStableReleaseIndex,updatedRelease_1);
            release := updatedRelease_2;
            version := nextStableReleaseIndex;
        } catch(e){};
    };

    public shared({caller}) func getCurrentReleaseVersion(): async Nat {
        if( Principal.toText(caller) != mainCanisterId) { throw Error.reject("Unauthorized access."); };
        return version;
    };

    public shared({caller}) func allowUpdatesToBackendCanister(): async (){
        if( Principal.toText(caller) != mainCanisterId) { throw Error.reject("Unauthorized access."); };
        permitUpdateToBackend := true;
    };

    public shared({caller}) func installCode_backendCanister(cyclesSaveMode: Bool): async () {
        if(not permitUpdateToBackend) { throw Error.reject("Unauthorized access."); };
        let {backend; backend_without_timer} = release;
        var moduleToUse = backend;
        if(cyclesSaveMode) moduleToUse := backend_without_timer;
        let {wasmModule} = moduleToUse;
        await CanisterManagementMethods.installCodeBackendWasm(mainCanisterId, wasmModule);
        permitUpdateToBackend := false;
    };

    public shared({caller}) func installCode_treasuryCanister(canisterData: MainTypes.DaoMetaData): async () {
        if(Principal.toText(caller) != mainCanisterId) { throw Error.reject("Unauthorized access."); };
        let {treasury;} = release;
        let {wasmModule;} = treasury;
        await CanisterManagementMethods.installCodeTreasuryWasm(canisterData, wasmModule);
    };

    public shared({caller}) func installCode_journalCanisters( profilesArray: MainTypes.UserProfilesArray ): async (){
        if(Principal.toText(caller) != mainCanisterId) { throw Error.reject("Unauthorized access."); };
        let {journal} = release;
        let {wasmModule} = journal;
        await CanisterManagementMethods.installCodeJournalWasms(wasmModule, profilesArray);
    };

    public shared({caller}) func installCode_frontendCanister(canisterData: MainTypes.DaoMetaData): 
    async ([AssetCanister.BatchOperationKind]){
        if(Principal.toText(caller) != mainCanisterId) { throw Error.reject("Unauthorized access."); };
        let {frontend} = release; let {wasmModule} = frontend;
        await CanisterManagementMethods.installFrontendWasm(canisterData, wasmModule);
        let operations = await CanisterManagementMethods.uploadAssetsToFrontEndCanister(canisterData, release);
        return operations;
    };

    // Return the cycles received up to the capacity allowed
    public func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = capacity - Cycles.balance();
        let accepted = 
            if (amount <= limit) amount
            else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        { accepted = Nat64.fromNat(accepted) };
    };


    private func canisterAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query({caller}) func canisterAccount() : async Account.AccountIdentifier {
        if( Principal.toText(caller) != mainCanisterId) { throw Error.reject("Unauthorized access."); };
        canisterAccountId();
    };

    public shared({caller}) func canisterBalance() : async Ledger.ICP {
        if( Principal.toText(caller) != mainCanisterId ) { throw Error.reject("Unauthorized access."); };
        await ledger.account_balance({ account = canisterAccountId() })
    };
   
    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)}
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };

    private func textKey(x: Text) : Trie.Key<Text> {
        return {key = x; hash = Text.hash(x)}
    };

}