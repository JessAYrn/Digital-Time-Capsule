import Ledger "NNS/Ledger";
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
import Timer "mo:base/Timer";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Account "Serializers/Account";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import IC "Types/IC/types";
import AssetCanister "Types/AssetCanister/types";
import WasmStore "Types/WasmStore/types";
import HashMap "mo:base/HashMap";
import MainTypes "Types/Main/types";
import CanisterManagementMethods "/Modules/Manager/CanisterManagementMethods";
import AssetManagementFunctions "Modules/AssetCanister/AssetManagementFunctions";
import JournalTypes "Types/Journal/types";

shared(msg) actor class Manager (principal : Principal) = this {

    private let ic : IC.Self = actor "aaaaa-aa";

    private stable var currentVersionLoaded : {number: Nat; isStable: Bool} = {number = 170; isStable = true;};

    private stable var currentVersionInstalled : {number: Nat; isStable: Bool} = currentVersionLoaded;

    private stable var nextStableVersion : {number: Nat; isStable: Bool} = currentVersionLoaded;

    private stable var previousVersionInstalled : {number: Nat; isStable: Bool} = currentVersionLoaded;

    private stable var mainCanisterId : Text = Principal.toText(principal); 

    private var capacity = 1000000000000;

    private let oneICP : Nat64 = 100_000_000;

    private let dummyPrincipal : Principal = Principal.fromText("2vxsx-fae");

    private let dummyBlob = Principal.toBlob(dummyPrincipal);

    private let dummyWasmData : WasmStore.WasmData = {
        dev = dummyPrincipal;
        wasmModule = dummyBlob;
    };

    private stable var release : WasmStore.Release = {
        assets = [];
        frontend = dummyWasmData;
        backend = dummyWasmData;
        journal = dummyWasmData;
        manager = dummyWasmData;
        treasury = dummyWasmData;
    };

    private stable var loadProgress : {
        totalNumberOfAssets : Nat;
        numberOfAssetsLoaded : Nat;
        totalNumberOfModules : Nat;
        numberOfModulesLoaded : Nat;
    } = {
        totalNumberOfAssets = 0;
        numberOfAssetsLoaded = 0;
        totalNumberOfModules = 5;
        numberOfModulesLoaded = 0;
    };

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public shared({caller}) func wallet_balance() : async Nat {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        return Cycles.balance()
    };

    public query({caller}) func getReleaseModule(canister: Text): async WasmStore.WasmData{
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        if( canister == WasmStore.wasmTypes.frontend) { return release.frontend; };
        if( canister == WasmStore.wasmTypes.backend) { return release.backend; };
        if( canister == WasmStore.wasmTypes.manager) { return release.manager; };
        if( canister == WasmStore.wasmTypes.journal) { return release.journal; };
        if( canister == WasmStore.wasmTypes.treasury) { return release.treasury; };
        throw Error.reject("Canister Module not found.");};

    public shared({caller}) func loadRelease(): async () {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};

        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        var nextAppropriateRelease = await wasmStore.getNextAppropriateRelease(currentVersionInstalled);
        await loadModules(nextAppropriateRelease.number);
        await loadAssets(nextAppropriateRelease.number);
        currentVersionLoaded := nextAppropriateRelease;
    };

    public shared({caller}) func loadPreviousRelease(): async () {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        await loadModules(previousVersionInstalled.number);
        await loadAssets(previousVersionInstalled.number);
        currentVersionLoaded := previousVersionInstalled;
    };

    public query({caller}) func getIsLoadingComplete(): async Bool {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        return loadProgress.numberOfModulesLoaded == loadProgress.totalNumberOfModules and loadProgress.numberOfAssetsLoaded == loadProgress.totalNumberOfAssets;
    };

    public query({caller}) func getCurrentVersions(): async {
        currentVersionLoaded: {number: Nat; isStable: Bool};
        currentVersionInstalled: {number: Nat; isStable: Bool};
    }{
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        return {currentVersionInstalled; currentVersionLoaded;};
    };

    public shared({caller}) func scheduleBackendCanisterToBeUpdated(): async (){
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        let {setTimer} = Timer;
        let timerId = setTimer(#nanoseconds(1), func (): async (){ await installCode_backendCanister(#upgrade(?{skip_pre_upgrade = ?false})); });
    };


    private func installCode_backendCanister(mode: {#upgrade: ?{skip_pre_upgrade: ?Bool}; #install; #reinstall}): async () {
        let {backend} = release;
        let {wasmModule} = backend;
        try{ await CanisterManagementMethods.installCodeBackendWasm(mainCanisterId, wasmModule, mode); finalizeInstall();} 
        catch (e) {
            await loadPreviousRelease();
            let backendCanister : MainTypes.Interface = actor(mainCanisterId);
            await CanisterManagementMethods.installCodeBackendWasm(mainCanisterId, wasmModule, mode);
            ignore backendCanister.scheduleCanistersToBeUpdatedExceptBackend();
        };
    };

    public shared({caller}) func installCode_treasuryCanister(
        canisterData: {treasuryCanisterPrincipal: Text; backEndPrincipal: Text;},
        mode: {#upgrade: ?{skip_pre_upgrade: ?Bool}; #install; #reinstall}
    ): async () {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        let {treasury;} = release;
        let {wasmModule;} = treasury;
        await CanisterManagementMethods.installCodeTreasuryWasm(canisterData, wasmModule, mode);
    };

    public shared({caller}) func installCode_journalCanisters( 
        profilesArray: [(Principal, {canisterId: Principal})],
        mode: {#upgrade: ?{skip_pre_upgrade: ?Bool}; #install; #reinstall}
    ): async (){
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        let {journal} = release;
        let {wasmModule} = journal;
        await CanisterManagementMethods.installCodeJournalWasms(wasmModule, profilesArray, mode);
    };

    public shared({caller}) func installCode_frontendCanister(
        canisterData: {frontEndPrincipal: Text},
        mode: {#upgrade: ?{skip_pre_upgrade: ?Bool}; #install; #reinstall}
    ): 
    async ([AssetCanister.BatchOperationKind]){
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        let {frontend} = release; let {wasmModule} = frontend;
        await CanisterManagementMethods.installFrontendWasm(canisterData, wasmModule, mode);
        let operations = await CanisterManagementMethods.uploadAssetsToFrontEndCanister(canisterData, release);
        return operations;
    };

    private func finalizeInstall():  () { currentVersionInstalled := currentVersionLoaded; };

    public shared({caller}) func resetLoadProgress(): async () {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        loadProgress := { loadProgress with numberOfModulesLoaded = 0; numberOfAssetsLoaded = 0; };
    };

    public shared({caller}) func loadModules(nextVersionToUpgradeTo: Nat) : async (){
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let { backend; frontend; manager; journal; treasury; } = WasmStore.wasmTypes;
        let backendWasm = await wasmStore.getModule(nextVersionToUpgradeTo, backend);
        let frontendWasm = await wasmStore.getModule(nextVersionToUpgradeTo, frontend);
        let managerWasm = await wasmStore.getModule(nextVersionToUpgradeTo, manager);
        let journalWasm = await wasmStore.getModule(nextVersionToUpgradeTo, journal);
        let treasuryWasm = await wasmStore.getModule(nextVersionToUpgradeTo, treasury);
        release := {
            release with 
            frontend = frontendWasm;
            backend = backendWasm;
            journal = journalWasm;
            manager = managerWasm;
            treasury = treasuryWasm;
        };
        loadProgress := { loadProgress with numberOfModulesLoaded = 5; };
    };

    public shared({caller}) func loadAssets(nextVersionToUpgradeTo: Nat): async () {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let keys = await wasmStore.getAssetKeys(nextVersionToUpgradeTo);
        let length = keys.size();
        loadProgress := { loadProgress with totalNumberOfAssets = length;};
        let assetsMap = HashMap.HashMap<AssetCanister.Key, AssetCanister.AssetArgs>(length, Text.equal, Text.hash);
        var index = 0;

        while(index < length){
            let key = keys[index];

            func loadAsset(key: Text): async (){
                let assetMetaData = await wasmStore.getAssetMetaDataWithoutChunksData(nextVersionToUpgradeTo, key);
                let {content_type; max_age; headers; enable_aliasing; allow_raw_access;} = assetMetaData;
                let ChunksBuffer = Buffer.Buffer<(AssetCanister.ChunkId, AssetCanister.ChunkData)>(1);
                var continue_ = true;
                var chunkIndex = 0;
                while(continue_){
                    try{
                        let (chunkId, chunkData) = await wasmStore.getAssetChunk(nextVersionToUpgradeTo, key, chunkIndex);
                        ChunksBuffer.add((chunkId, chunkData));
                        chunkIndex += 1;
                    } catch(e){ continue_ := false; };
                };

                let chunks = Buffer.toArray(ChunksBuffer);

                let asset: AssetCanister.AssetArgs = {
                    content_type;
                    max_age;
                    headers; 
                    enable_aliasing;
                    allow_raw_access;
                    chunks;
                };
                assetsMap.put(key, asset);
                loadProgress := {loadProgress with numberOfAssetsLoaded = loadProgress.numberOfAssetsLoaded + 1 };
                if(loadProgress.numberOfAssetsLoaded == loadProgress.totalNumberOfAssets){
                    release := {release with assets = Iter.toArray(assetsMap.entries())};
                };
            };
            ignore loadAsset(key);
            index += 1;
        };
        return; 
    };

    public shared({caller}) func notifyNextStableRelease(): async() {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let nextStableVersion_ = await wasmStore.getNextAppropriateRelease(currentVersionInstalled);
        nextStableVersion := nextStableVersion_;
    };

    public query({caller}) func getWhatIsNextStableReleaseVersion(): async {number: Nat; isStable: Bool} {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        return nextStableVersion;
    };

    public query ({caller}) func getCyclesBalance(): async Nat {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        return Cycles.balance();
    };

    // Return the cycles received up to the capacity allowed
    public shared func wallet_receive() : async { accepted: Nat64 } {
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
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
        canisterAccountId();
    };

    public shared({caller}) func canisterBalance() : async Ledger.ICP {
        if( 
            Principal.toText(caller) != mainCanisterId and 
            Principal.toText(caller) != Principal.toText(Principal.fromActor(this))
        ){ throw Error.reject("Unauthorized access.");};
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