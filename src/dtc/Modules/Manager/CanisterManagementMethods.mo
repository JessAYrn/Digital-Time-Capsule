import MainTypes "../../Types/Main/types";
import AssetCanister "../../Types/AssetCanister/types";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import AssetManagementFunctions "../../Modules/AssetCanister/AssetManagementFunctions";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import IC "../../Types/IC/types";
import Error "mo:base/Error";
import Journal "../../Journal";
import WasmStore "../../Types/WasmStore/types";

module{
    
    private let ic : IC.Self = actor "aaaaa-aa";

    public func installCodeJournalWasms( wasmModule: Blob, profilesArray : [(Principal, {canisterId: Principal})]): 
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

    public func installCodeTreasuryWasm( daoMetaData: {treasuryCanisterPrincipal: Text; backEndPrincipal: Text;}, wasmModule: Blob): async (){
        let {treasuryCanisterPrincipal; backEndPrincipal;} = daoMetaData;
        let treasuryCanisterBlob = Principal.fromText(treasuryCanisterPrincipal);
        let backEndPrincipalBlob = Principal.fromText(backEndPrincipal);
        await installCode_(?backEndPrincipalBlob, wasmModule, treasuryCanisterBlob);
    };


    public func installFrontendWasm( daoMetaData: {frontEndPrincipal: Text}, wasmModule: Blob): async (){
        let {frontEndPrincipal} = daoMetaData;
        let frontEndPrincipalBlob = Principal.fromText(frontEndPrincipal);
        await installCode_(null, wasmModule, frontEndPrincipalBlob);
    };

    public func uploadAssetsToFrontEndCanister(canisterData: {frontEndPrincipal: Text}, release: WasmStore.Release) : 
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
            mode = #upgrade(?{ skip_pre_upgrade = ?false });
            canister_id;
            sender_canister_version = null;
        });
        await ic.start_canister({canister_id});
    };
}