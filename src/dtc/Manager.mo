import Ledger "NNS/Ledger";
import Error "mo:base/Error";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Account "Serializers/Account";
import Bool "mo:base/Bool";
import WasmStore "Types/WasmStore/types";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import CanisterManagementMethods "/Modules/Manager/CanisterManagementMethods";

shared(msg) actor class Manager (principal : Principal) = this {

    private stable var currentVersionLoaded : { number: Nat; } = { number = 1; };
    private stable var currentVersionInstalled : {number: Nat;} = currentVersionLoaded;
    private stable var newVersionAvailable : Bool = false;
    private stable var mainCanisterId : Text = Principal.toText(principal); 
    private var capacity = 1_000_000_000_000;
    private stable var release : WasmStore.Release = { assets = []; wasmModules = []; };
    private stable var loadProgress : { totalNumberOfAssets : Nat; numberOfAssetsLoaded : Nat; totalNumberOfModules : Nat; numberOfModulesLoaded : Nat; } = { totalNumberOfAssets = 0; numberOfAssetsLoaded = 0; totalNumberOfModules = 5; numberOfModulesLoaded = 0; };
    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public shared({caller}) func wallet_balance() : async Nat {
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        }; return Cycles.balance()
    };

    public query({caller}) func getReleaseModule(wasmType: WasmStore.WasmType): async Blob{
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access."); 
        };
        switch(findWasmModule(wasmType, release.wasmModules)){
            case(?#Frontend(wasmModule)){ return wasmModule };
            case(?#Backend(wasmModule)){ return wasmModule };
            case(?#Manager(wasmModule)){ return wasmModule };
            case(?#Journal(wasmModule)){ return wasmModule };
            case(?#Treasury(wasmModule)){ return wasmModule };
            case(_) {throw Error.reject("Wasm Module Not Found")}
        };
    };

    public shared({caller}) func loadRelease(): async () {
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        };
        let nextReleaseVersion = { number = currentVersionInstalled.number + 1; };
        await loadModules(nextReleaseVersion.number);
        await loadAssets(nextReleaseVersion.number);
        currentVersionLoaded := nextReleaseVersion;
    };

    public query({caller}) func getIsLoadingComplete(): async Bool {
        if(Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        };
        return loadProgress.numberOfModulesLoaded == loadProgress.totalNumberOfModules and loadProgress.numberOfAssetsLoaded == loadProgress.totalNumberOfAssets;
    };

    public query({caller}) func getCurrentVersions(): async {currentVersionLoaded: {number: Nat;}; currentVersionInstalled: {number: Nat;};}{
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        }; return {currentVersionInstalled; currentVersionLoaded;};
    };

    public func uploadAssetsToFrontendCanister(frontEndPrincipal: Text): async (){
        ignore await CanisterManagementMethods.uploadAssetsToFrontEndCanister(frontEndPrincipal, release.assets);   
    };

    public shared({caller}) func installCurrentVersionLoaded(
        daoMetaData: {frontEndPrincipal: Text; treasuryCanisterPrincipal: Text; backEndPrincipal: Text;}, 
        profilesArray: [(Principal, {canisterId: Principal})],
        mode: {#upgrade: ?{skip_pre_upgrade: ?Bool}; #install; #reinstall}
    ): async (){

        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        }; 

        let {frontEndPrincipal; treasuryCanisterPrincipal; backEndPrincipal} = daoMetaData;
        for(wasmModule in Iter.fromArray(release.wasmModules)){
            switch(wasmModule){
                case(#Frontend(wasmModule)){ 
                    func upgradeFrontendCanister(): async (){
                        await CanisterManagementMethods.installCode_(null, wasmModule, Principal.fromText(frontEndPrincipal), mode);
                        ignore await CanisterManagementMethods.uploadAssetsToFrontEndCanister(frontEndPrincipal, release.assets);   
                    };
                    ignore upgradeFrontendCanister(); 
                };
                case(#Backend(wasmModule)){ 
                    ignore CanisterManagementMethods.installCode_(null, wasmModule, Principal.fromText(backEndPrincipal), mode);
                };
                case(#Treasury(wasmModule)){ 
                    let treasuryCanisterPrincipalBlob = Principal.fromText(treasuryCanisterPrincipal);
                    let backendCanisterPrincipalBlob = Principal.fromText(backEndPrincipal);
                    ignore CanisterManagementMethods.installCode_(?backendCanisterPrincipalBlob, wasmModule, treasuryCanisterPrincipalBlob, mode); 
                };
                case(#Journal(wasmModule)){ 
                    for((_, profile) in Iter.fromArray(profilesArray)) { 
                        ignore CanisterManagementMethods.installCode_(null, wasmModule, profile.canisterId, mode); 
                    };
                };
                case(#Manager(wasmModule)){ 
                    // install for this module is performed by the main canister}
                };
            };
        };
        currentVersionInstalled := currentVersionLoaded;
        newVersionAvailable := false;
    };

    public shared({caller}) func resetLoadProgress(): async () {
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        };
        loadProgress := { loadProgress with numberOfModulesLoaded = 0; numberOfAssetsLoaded = 0; };
    };

    private func loadModules(nextVersionToUpgradeTo: Nat) : async (){
        loadProgress := { loadProgress with numberOfModulesLoaded = 0; };
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let backendWasm = await wasmStore.getModule({version = nextVersionToUpgradeTo; wasmType = #Backend});
        let frontendWasm = await wasmStore.getModule({version = nextVersionToUpgradeTo; wasmType = #Frontend});
        let managerWasm = await wasmStore.getModule({version = nextVersionToUpgradeTo; wasmType = #Manager});
        let journalWasm = await wasmStore.getModule({version = nextVersionToUpgradeTo; wasmType = #Journal});
        let treasuryWasm = await wasmStore.getModule({version = nextVersionToUpgradeTo; wasmType = #Treasury});

        release := { release with wasmModules = [journalWasm, frontendWasm, backendWasm, treasuryWasm, managerWasm]; };
        loadProgress := { loadProgress with numberOfModulesLoaded = 5; };
    };

    private func loadAssets(nextVersionToUpgradeTo: Nat): async () {
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let assetsKeys = await wasmStore.getAssetKeys({version = nextVersionToUpgradeTo});
        loadProgress := { loadProgress with totalNumberOfAssets = assetsKeys.size(); numberOfAssetsLoaded = 0};
        let assetsMap = HashMap.HashMap<WasmStore.Key, WasmStore.AssetData>(assetsKeys.size(), Text.equal, Text.hash);

        func loadAsset(key: Text): async (){
                
            let ChunksBuffer = Buffer.Buffer<(WasmStore.ChunkId, WasmStore.ChunkData)>(1);
            var chunkIndex = 0;
            label retreivingChunksData while(true){
                try{ ChunksBuffer.add( await wasmStore.getAssetChunk({version = nextVersionToUpgradeTo; key; chunkId = chunkIndex}) ); chunkIndex += 1; } 
                catch(_){ break retreivingChunksData; };
            };
            let chunks = Buffer.toArray(ChunksBuffer);

            let assetDataWithoutChunks = await wasmStore.getAssetMetaDataWithoutChunksData({ version = nextVersionToUpgradeTo; key });
            assetsMap.put(key, { assetDataWithoutChunks with chunks; });

            loadProgress := {loadProgress with numberOfAssetsLoaded = loadProgress.numberOfAssetsLoaded + 1 };
            if(loadProgress.numberOfAssetsLoaded == loadProgress.totalNumberOfAssets){
                release := {release with assets = Iter.toArray(assetsMap.entries())};
            };
        };

        for(key in Iter.fromArray(assetsKeys)) await loadAsset(key);
    };

    public shared({caller}) func checkForNewRelease(): async() {
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        };
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let latestReleaseNumber = await wasmStore.getLatestRelease();
        if(latestReleaseNumber > currentVersionInstalled.number){ newVersionAvailable := true; };
    };

    public query({caller}) func hasNewRelease(): async Bool {
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        };
        return newVersionAvailable;
    };

    public query ({caller}) func getCyclesBalance(): async Nat {
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        }; 
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

    private func findWasmModule(wasmType: WasmStore.WasmType, wasmModules: [WasmStore.WasmModule]): ?WasmStore.WasmModule {
    let ?wasmModule = Array.find<WasmStore.WasmModule>(
      wasmModules, 
      func(wasmModule: WasmStore.WasmModule): Bool{
        switch(wasmType){
          case(#Backend){ switch(wasmModule){ case(#Backend(_)){return true}; case(_){ return false }; } };
          case(#Frontend){ switch(wasmModule){ case(#Frontend(_)){return true}; case(_){ return false }; } };
          case(#Manager){ switch(wasmModule){ case(#Manager(_)){return true}; case(_){ return false }; } };
          case(#Treasury){ switch(wasmModule){ case(#Treasury(_)){return true}; case(_){ return false }; } };
          case(#Journal){ switch(wasmModule){ case(#Journal(_)){return true}; case(_){ return false }; } };
        }
      }
    ) else { return null };
    return ?wasmModule
  };
}