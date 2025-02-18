module {

    public let wasmStoreCanisterId = "b5jc2-xyaaa-aaaam-adsba-cai";

    public type AssetMetaData = {
        content_type : Text;
        encodings: [{ content_encoding : Text; length : Nat; modified :Int; sha256 : ?Blob; }];
        key : Key;
    };

    public type AssetData = {
        content_type : Text;
        headers : ?[HeaderField];
        allow_raw_access : ?Bool;
        chunks : [(ChunkId, ChunkData)];
        max_age : ?Nat64;
        enable_aliasing : ?Bool;
    }; 

    public type Assets = [(Key, AssetData)];
    public type Release = { assets: Assets; wasmModules: [WasmModule]; };
    public type Chunk = Blob;
    public type ChunkData = (Content_encoding, Sha256, Chunk);
    public type ChunkId = Nat;
    public type Content_encoding = Text;
    public type Error ={
        #IncompleteRelease;
        #WasmModuleNotFound;
        #AssetNotFound;
        #NoNewVersionAvailable;
        #VersionNotCreated;
        #NotFound;
        #AlreadyExists;
        #NotAuthorized;
        #NoInputGiven;
        #InsufficientFunds;
        #TxFailed;
        #UserNameTaken;
        #WalletBalanceTooLow;
        #ZeroAddress;
        #NotAcceptingRequests;
    };
    public type HeaderField = { text : Text };
    public type Key = Text;
    public type Key__1 = Text;
    public type Sha256 = ?Blob;
    public type WasmType = { #API; #UI; #User; #Manager; #Treasury; };
    public type WasmModule = { #User: Blob; #UI: Blob; #API: Blob; #Treasury: Blob; #Manager: Blob; };

    public type Interface = actor {
        getAssetChunk : shared query { key : Key; chunkId : Nat; version : Nat; } -> async (ChunkId, ChunkData);
        getAssetKeys : shared query { version : Nat } -> async [Key__1];
        getAssetMetaDataWithoutChunksData : shared query { key : Key; version : Nat; } -> async AssetData;
        getLatestRelease : shared query () -> async Nat;
        getModule : shared { wasmType : WasmType; version : Nat } -> async WasmModule;
    }
}