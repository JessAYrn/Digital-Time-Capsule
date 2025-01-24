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
import Timer "mo:base/Timer";
import IC "/Types/IC/types";
import CanisterManagementMethods "/Modules/Manager/CanisterManagementMethods";

shared(msg) actor class Manager (principal : Principal) = this {

    private stable var currentVersionLoaded : { number: Nat; } = { number = 3; };
    private stable var currentVersionInstalled : {number: Nat;} = currentVersionLoaded;
    private stable var newVersionAvailable : Bool = false;
    private stable var mainCanisterId : Text = Principal.toText(principal); 
    private stable var release : WasmStore.Release = { assets = []; wasmModules = []; };
    private var releaseAssetsHashMap: HashMap.HashMap<WasmStore.Key, WasmStore.AssetData> = HashMap.fromIter(Iter.fromArray(release.assets), Iter.size(Iter.fromArray(release.assets)), Text.equal, Text.hash);
    private stable var expectedNumberOfAssetsAndModules : { totalNumberOfAssets : Nat; totalNumberOfModules : Nat; } = { totalNumberOfAssets = 0; totalNumberOfModules = 5; };
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
        await loadModules();
        await loadAssets();
        currentVersionLoaded := {number = currentVersionInstalled.number + 1};
    };

    public query({caller}) func getIsLoadingComplete(): async Bool {
        if(Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        };
        return Array.size(release.wasmModules) == expectedNumberOfAssetsAndModules.totalNumberOfModules and Array.size(release.assets) == expectedNumberOfAssetsAndModules.totalNumberOfAssets;
    };

    public query({caller}) func getCurrentVersions(): async {currentVersionLoaded: {number: Nat;}; currentVersionInstalled: {number: Nat;};}{
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        }; return {currentVersionInstalled; currentVersionLoaded;};
    };

    public func uploadAssetsToFrontendCanister(frontEndPrincipal: Text): async (){
        let isFinishedLoading = await getIsLoadingComplete();
        if(not isFinishedLoading){
            await loadAssets();
            let {setTimer} = Timer;
            ignore setTimer<system>(#seconds(3 * 60), func(): async (){ await uploadAssetsToFrontendCanister(frontEndPrincipal);  });
            return;
        };
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
                        await uploadAssetsToFrontendCanister(frontEndPrincipal);   
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

    public shared({caller}) func resetReleaseData(): async () {
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        };
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let assetsKeys = await wasmStore.getAssetKeys({version = currentVersionInstalled.number + 1});
        release := {wasmModules = []; assets = []};
        releaseAssetsHashMap := HashMap.HashMap<WasmStore.Key, WasmStore.AssetData>(assetsKeys.size(), Text.equal, Text.hash);
    };

    private func loadModules() : async (){
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let backendWasm = await wasmStore.getModule({version = currentVersionInstalled.number + 1; wasmType = #Backend});
        let frontendWasm = await wasmStore.getModule({version = currentVersionInstalled.number + 1; wasmType = #Frontend});
        let managerWasm = await wasmStore.getModule({version = currentVersionInstalled.number + 1; wasmType = #Manager});
        let journalWasm = await wasmStore.getModule({version = currentVersionInstalled.number + 1; wasmType = #Journal});
        let treasuryWasm = await wasmStore.getModule({version = currentVersionInstalled.number + 1; wasmType = #Treasury});

        release := { release with wasmModules = [journalWasm, frontendWasm, backendWasm, treasuryWasm, managerWasm]; };
    };

    public shared({caller}) func loadAssets(): async () {
        if( Principal.toText(caller) != mainCanisterId and Principal.toText(caller) != Principal.toText(Principal.fromActor(this))){ 
            throw Error.reject("Unauthorized access.");
        };
        let nextVersionToUpgradeTo = currentVersionInstalled.number + 1;
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let assetsKeys = await wasmStore.getAssetKeys({version = nextVersionToUpgradeTo});
        expectedNumberOfAssetsAndModules := { expectedNumberOfAssetsAndModules with totalNumberOfAssets = assetsKeys.size();};

        func loadAsset(key: Text): async (){
                
            let ChunksBuffer = Buffer.Buffer<(WasmStore.ChunkId, WasmStore.ChunkData)>(1);
            var chunkIndex = 0;
            label retreivingChunksData while(true){
                try{ ChunksBuffer.add( await wasmStore.getAssetChunk({version = nextVersionToUpgradeTo; key; chunkId = chunkIndex}) ); chunkIndex += 1; } 
                catch(_){ break retreivingChunksData; };
            };
            let chunks = Buffer.toArray(ChunksBuffer);

            let assetDataWithoutChunks = await wasmStore.getAssetMetaDataWithoutChunksData({ version = nextVersionToUpgradeTo; key });
            releaseAssetsHashMap.put(key, { assetDataWithoutChunks with chunks; });

            if(releaseAssetsHashMap.size() == expectedNumberOfAssetsAndModules.totalNumberOfAssets){
                release := {release with assets = Iter.toArray(releaseAssetsHashMap.entries())};
            };
        };

        label loadingAssets for(key in Iter.fromArray(assetsKeys)){
            switch(releaseAssetsHashMap.get(key)){
                case null{ ignore loadAsset(key); };
                case(?_){ continue loadingAssets };
            };
        };
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
        let accepted = Cycles.accept<system>(amount);
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
