import AssetCanister "../AssetCanister/AssetCanister";
import Result "mo:base/Result";


module{

     public type WasmData = {
        dev : Principal;
        wasmModule: Blob
    };

    public type Release = {
        assets: AssetCanister.Assets;
        frontend: WasmData;
        backend: WasmData;
        backend_without_timer: WasmData;
        journal: WasmData;
        manager: WasmData;
        treasury: WasmData;
    };

    public let wasmTypes  = { 
        backend = "BACKEND"; 
        frontend = "FRONTEND"; 
        manager = "MANAGER"; 
        journal = "JOURNAL"; 
        backend_without_timer = "BACKEND_WITHOUT_TIMER";
        treasury = "TREASURY";
    };

    public type Error = {
        #NoNewVersionAvailable;
        #VersionNotCreated;
        #WasmModuleNotFound;
        #AssetNotFound;
    };

    public let wasmStoreCanisterId = "mow67-rqaaa-aaaap-qa6na-cai";

    public type Interface = actor {
        getAssetKeys: query (Nat) -> async [AssetCanister.Key];
        getLatestReleaseNumber: query () -> async Nat;
        getNextRequiredRelease: query (Nat) -> async Nat;
        getNextAppropriateRelease: query ({number: Nat; isStable: Bool;}) -> async {number: Nat; isStable: Bool;};
        getModule: (Nat, Text) -> async WasmData;
        getAssetMetaDataWithoutChunksData: (Nat, AssetCanister.Key) -> async AssetCanister.AssetArgs;
        getLastestStableRelease: query () -> async {number: Nat; isStable: Bool;};
        getAssetChunk: (Nat, Text, Nat) -> async (AssetCanister.ChunkId, AssetCanister.ChunkData);
    };
};