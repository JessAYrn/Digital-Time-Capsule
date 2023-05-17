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
        journal: WasmData;
        manager: WasmData;
    };

    public let wasmTypes : { backend: Text; frontend: Text; manager: Text; journal: Text; } = 
    { backend = "BACKEND"; frontend = "FRONTEND"; manager = "MANAGER"; journal = "JOURNAL"};

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
        getNextStableRelease: query (Nat) -> async Nat;
        getModule: (Nat, Text) -> async WasmData;
        getAssetMetaDataWithoutChunksData: (Nat, AssetCanister.Key) -> async AssetCanister.AssetArgs;
        getAssetChunk: (Nat, Text, Nat) -> async (AssetCanister.ChunkId, AssetCanister.ChunkData);
    };
};