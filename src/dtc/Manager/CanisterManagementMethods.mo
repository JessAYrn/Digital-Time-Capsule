import MainTypes "../Main/types";
import AssetCanister "../AssetCanister/AssetCanister";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import AssetManagementFunctions "../AssetCanister/AssetManagementFunctions";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import IC "../IC/ic.types";
import Error "mo:base/Error";
import Journal "../Journal/Journal";
import WasmStore "WasmStore";

module{
    
    private let ic : IC.Self = actor "aaaaa-aa";

    public func loadModules(nextVersionToUpgradeTo: Nat, release: WasmStore.Release) : async WasmStore.Release{
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let { backend; frontend; manager; journal; backend_without_timer; treasury; } = WasmStore.wasmTypes;
        let backendWasm = await wasmStore.getModule(nextVersionToUpgradeTo, backend);
        let backendWithoutTimer = await wasmStore.getModule(nextVersionToUpgradeTo, backend_without_timer);
        let frontendWasm = await wasmStore.getModule(nextVersionToUpgradeTo, frontend);
        let managerWasm = await wasmStore.getModule(nextVersionToUpgradeTo, manager);
        let journalWasm = await wasmStore.getModule(nextVersionToUpgradeTo, journal);
        let treasuryWasm = await wasmStore.getModule(nextVersionToUpgradeTo, treasury);
        return {
            release with 
            frontend = frontendWasm;
            backend = backendWasm;
            backend_without_timer = backendWithoutTimer;
            journal = journalWasm;
            manager = managerWasm;
            treasury = treasuryWasm;
        };
    };

    public func loadAssets(nextVersionToUpgradeTo: Nat, release: WasmStore.Release): async WasmStore.Release {
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let keys = await wasmStore.getAssetKeys(nextVersionToUpgradeTo);
        let length = keys.size();
        var index = 0;
        let AssetBuffer = Buffer.Buffer<(AssetCanister.Key, AssetCanister.AssetArgs)>(1);
        while(index < length){
            let key = keys[index];
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

        return{ release with assets = AssetBuffer.toArray(); };
    };

    public func installCodeJournalWasms( wasmModule: Blob, profilesArray : MainTypes.UserProfilesArray): 
    async () {
        let profilesSize = profilesArray.size();
        var index = 0;
        while(index < profilesSize){
            let (principal, profile) = profilesArray[index];
            ignore installCode_(?principal, wasmModule, profile.canisterId);
            index += 1;
        };
    };

    public func installCodeBackendWasm( backEndPrincipal: Text, wasmModule: Blob): async (){
        let backEndPrincipalBlob = Principal.fromText(backEndPrincipal);
        await installCode_(null, wasmModule, backEndPrincipalBlob);
    };

    public func installCodeTreasuryWasm( daoMetaData: MainTypes.DaoMetaData, wasmModule: Blob): async (){
        let {treasuryCanisterPrincipal; backEndPrincipal;} = daoMetaData;
        let treasuryCanisterBlob = Principal.fromText(treasuryCanisterPrincipal);
        let backEndPrincipalBlob = Principal.fromText(backEndPrincipal);
        await installCode_(?backEndPrincipalBlob, wasmModule, treasuryCanisterBlob);
    };


    public func installFrontendWasm( daoMetaData: MainTypes.DaoMetaData, wasmModule: Blob): async (){
        let {frontEndPrincipal} = daoMetaData;
        let frontEndPrincipalBlob = Principal.fromText(frontEndPrincipal);
        await installCode_(null, wasmModule, frontEndPrincipalBlob);
    };

    public func uploadAssetsToFrontEndCanister(canisterData: MainTypes.DaoMetaData, release: WasmStore.Release) : 
    async ([AssetCanister.BatchOperationKind]) {
        let {frontEndPrincipal} = canisterData;
        let frontendCanister: AssetCanister.Interface = actor(frontEndPrincipal);

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
            let numberOfChunks = chunks.size();
            var index__ = 0;
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

    private func installCode_ (argument: ?Principal, wasm_module: Blob, canister_id: Principal) : async () {
        var arg = to_candid(null);
        switch(argument){ case null {}; case (?argument_){ arg := to_candid(argument_); } };
        await ic.stop_canister({canister_id});
        await ic.install_code({
            arg;
            wasm_module;
            mode = #upgrade;
            canister_id;
        });
        await ic.start_canister({canister_id});
    };
}