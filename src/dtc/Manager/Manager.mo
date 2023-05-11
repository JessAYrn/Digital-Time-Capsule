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

shared(msg) actor class Manager (principal : Principal) = this {

    private let ic : IC.Self = actor "aaaaa-aa";

    private stable var version : Nat = 0;

    private stable var mainCanisterId : Text = Principal.toText(principal); 

    private var capacity = 1000000000000;

    private var balance = Cycles.balance();

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
        journal = dummyWasmData;
        manager = dummyWasmData;
    };

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public shared(msg) func wallet_balance() : async Nat {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId ) {
            throw Error.reject("Unauthorized access.");
        };
        return balance
    };

    public shared(msg) func initializeReleaseVersion (): async () {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId) { throw Error.reject("Unauthorized access."); };
        let wasmStoreCanister : WasmStore.Interface = actor (WasmStore.wasmStoreCanisterId);
        let mostRecentReleaseVersion: Nat = await wasmStoreCanister.getLatestReleaseNumber();
        version := mostRecentReleaseVersion;
    };

    public shared(msg) func loadNextRelease(): async () {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId) { throw Error.reject("Unauthorized access.");};
        try{
            var newVersionIndex = await updateModules();
            newVersionIndex := await updateAssets();
            version := newVersionIndex;
        } catch(e){};
    };

    public shared(msg) func getCurrentReleaseVersion(): async Nat {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId) {
            throw Error.reject("Unauthorized access.");
        };
        return version;
    };

    public shared(msg) func allowUpdatesToBackendCanister(): async (){
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId) {
            throw Error.reject("Unauthorized access.");
        };
        permitUpdateToBackend := true;
    };

    public shared(msg) func installCode_backendCanister(): async () {
        if(not permitUpdateToBackend) {
            throw Error.reject("Unauthorized access.");
        };
        let {backend} = release;
        let {wasmModule} = backend;
        await CanisterManagementMethods.installCodeBackendWasm(mainCanisterId, wasmModule);
        permitUpdateToBackend := false;
    };

    public shared(msg) func installCode_journalCanisters(
        profilesArray: MainTypes.UserProfilesArray
    ): async (){
        let mainCanisterPrincipal = msg.caller;
        if(Principal.toText(mainCanisterPrincipal) != mainCanisterId) {
            throw Error.reject("Unauthorized access.");
        };
        let {journal} = release;
        let {wasmModule} = journal;
        await CanisterManagementMethods.installCodeJournalWasms(wasmModule, profilesArray);
    };

    public shared(msg) func installCode_frontendCanister(canisterData: MainTypes.CanisterData): 
    async ([AssetCanister.BatchOperationKind]){
        let mainCanisterPrincipal = msg.caller;
        if(Principal.toText(mainCanisterPrincipal) != mainCanisterId) {
            throw Error.reject("Unauthorized access.");
        };
        let {frontend} = release;
        let {wasmModule} = frontend;
        await CanisterManagementMethods.installFrontendWasm(canisterData, wasmModule);

        let frontendCanisterId = canisterData.frontEndPrincipal;
        let frontendCanister: AssetCanister.Interface = actor(frontendCanisterId);

        // clearing all of the assets from the canister
        let batch_id_for_clearing_operation = await frontendCanister.create_batch({});
        let batch_operation_clear_array: [AssetCanister.BatchOperationKind] = [#Clear({})];
        await frontendCanister.commit_batch({
            batch_id = batch_id_for_clearing_operation.batch_id;
            operations = batch_operation_clear_array;
        });

        // adding the new assets to the assets canister.
        let {batch_id} = await frontendCanister.create_batch({});

        let batchOperationsBuffer = Buffer.Buffer<AssetCanister.BatchOperationKind>(1);

        //pulling the new assets from the latest release.
        let {assets} = release;

        let numberOfAssets = assets.size();

        var index_ = 0;

        while(index_ < numberOfAssets){
            let (key, assetArgs) = assets[index_];
            let { allow_raw_access; chunks; content_type; enable_aliasing; headers; max_age;} = assetArgs;
            let batch_operation_create = await AssetManagementFunctions.getCreateAssetBatchOperation({
                key;
                content_type;
                enable_aliasing;
                headers;
                max_age;
                allow_raw_access; 
            });

            batchOperationsBuffer.add(batch_operation_create);

            var index__ = 0;
            let numberOfChunks = chunks.size();
            let chunksHashMap = HashMap.HashMap<AssetCanister.Content_encoding, (AssetCanister.Sha256, [AssetCanister.ChunkId])>(1, Text.equal, Text.hash);
            while(index__ < numberOfChunks){
                let (chunkIndex, (content_encoding, sha256, content)) = chunks[index__];
                let {chunk_id} = await frontendCanister.create_chunk({content; batch_id;});
                let chunkIdsArray = chunksHashMap.get(content_encoding);
                switch(chunkIdsArray){
                    case null{ chunksHashMap.put(content_encoding, (sha256, [chunk_id])); };
                    case(?(sha256, chunk_ids_array)){
                        let buffer = Buffer.fromArray<AssetCanister.ChunkId>(chunk_ids_array);
                        buffer.add(chunk_id);
                        chunksHashMap.put(content_encoding,(sha256, buffer.toArray()));
                    };
                };
                index__ += 1;
            };

            let chunksArraysByContentEncoding : [(AssetCanister.Content_encoding, (AssetCanister.Sha256,[AssetCanister.ChunkId]))] = 
            Iter.toArray(chunksHashMap.entries());

            let numberOfChunksArrays = chunksArraysByContentEncoding.size();
            index__ := 0;

            while(index__ < numberOfChunksArrays){
                let (content_encoding, (sha256, chunk_ids)) = chunksArraysByContentEncoding[index__];
                let batch_operation_set_asset_content = await AssetManagementFunctions.getSetAssetBatchOperation({
                    key; 
                    sha256; 
                    chunk_ids; 
                    content_encoding;
                });

                batchOperationsBuffer.add(batch_operation_set_asset_content);
                index__ +=1;
            };
            index_ += 1;
        };

        let operations = batchOperationsBuffer.toArray();

        let result = await frontendCanister.commit_batch({
            batch_id;
            operations;
        });

        return operations;
    };

    private func updateModules(): async Nat {
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let nextRequiredReleaseIndex = await wasmStore.getNextRequiredRelease(version);
        let { backend; frontend; manager; journal; } = WasmStore.wasmTypes;
        let backendWasm = await wasmStore.getModule(nextRequiredReleaseIndex, backend);
        let frontendWasm = await wasmStore.getModule(nextRequiredReleaseIndex, frontend);
        let managerWasm = await wasmStore.getModule(nextRequiredReleaseIndex, manager);
        let journalWasm = await wasmStore.getModule(nextRequiredReleaseIndex, journal);

        release := {
            assets = release.assets;
            frontend = frontendWasm;
            backend = backendWasm;
            journal = managerWasm;
            manager = journalWasm;
        };
        return nextRequiredReleaseIndex;
    };

    private func updateAssets(): async Nat{
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let nextRequiredReleaseIndex = await wasmStore.getNextRequiredRelease(version);
        let keys = await wasmStore.getAssetKeys();
        let length = keys.size();
        var index = 0;
        let AssetBuffer = Buffer.Buffer<(AssetCanister.Key, AssetCanister.AssetArgs)>(1);
        while(index < length){
            let key = keys[index];
            let assetMetaData = await wasmStore.getAssetMetaDataWithoutChunksData(nextRequiredReleaseIndex, key);
            let {content_type; max_age; headers; enable_aliasing; allow_raw_access;} = assetMetaData;
            let ChunksBuffer = Buffer.Buffer<(AssetCanister.ChunkId, AssetCanister.ChunkData)>(1);
            var continue_ = true;
            var chunkIndex = 0;
            while(continue_){
                try{
                    let (chunkId, chunkData) = await wasmStore.getAssetChunk(nextRequiredReleaseIndex, key, chunkIndex);
                    ChunksBuffer.add((chunkId, chunkData));
                    chunkIndex += 1;
                } catch(e){ continue_ := false; };
            };

            let chunks = ChunksBuffer.toArray();

            let asset: AssetCanister.AssetArgs = {
                content_type;
                max_age;
                headers; 
                enable_aliasing;
                allow_raw_access;
                chunks;
            };
            AssetBuffer.add(key, asset);
            index += 1;
        };

        release := {
            assets = AssetBuffer.toArray();
            frontend = release.frontend;
            backend = release.backend;
            journal = release.journal;
            manager = release.manager;
        };
        return nextRequiredReleaseIndex;
    };

    // Return the cycles received up to the capacity allowed
    public func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = capacity - balance;
        let accepted = 
            if (amount <= limit) amount
            else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        balance += accepted;
        { accepted = Nat64.fromNat(accepted) };
    };


    private func userAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query(msg) func canisterAccount() : async Account.AccountIdentifier {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId) {
            throw Error.reject("Unauthorized access.");
        };
        userAccountId()
    };

    public shared(msg) func canisterBalance() : async Ledger.ICP {
        let callerId = msg.caller;
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(callerId) !=  Principal.toText(canisterId)
            and Principal.toText(callerId) != mainCanisterId
        ) {
            throw Error.reject("Unauthorized access.");
        };
        await ledger.account_balance({ account = userAccountId() })
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