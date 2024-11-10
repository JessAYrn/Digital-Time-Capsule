import AssetCanister "../../Types/AssetCanister/types";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import IC "../../Types/IC/types";
import WasmStore "../../Types/WasmStore/types";

module{
    
    private let ic : IC.Self = actor "aaaaa-aa";

    public func uploadAssetsToFrontEndCanister(frontEndPrincipal: Text, assets: WasmStore.Assets) : async ([AssetCanister.BatchOperationKind]) {
        let frontendCanister: AssetCanister.Interface = actor(frontEndPrincipal);

        // clearing all of the assets from the canister
        let {batch_id = batch_id_for_clearing_assets} = await frontendCanister.create_batch({});
        await frontendCanister.commit_batch({ batch_id = batch_id_for_clearing_assets; operations = [#Clear({})]; });

        // adding the new assets to the assets canister.
        let {batch_id = batch_id_for_adding_assets} = await frontendCanister.create_batch({});

        let batchOperationsBuffer = Buffer.Buffer<AssetCanister.BatchOperationKind>(1);

        for((key, assetData) in Iter.fromArray(assets)){
            let { allow_raw_access; chunks; content_type; enable_aliasing; headers; max_age;} = assetData;
            batchOperationsBuffer.add(#CreateAsset({ key; content_type; enable_aliasing; headers; max_age; allow_raw_access; }));
            let chunksHashMap = HashMap.HashMap<AssetCanister.Content_encoding, (AssetCanister.Sha256, [AssetCanister.ChunkId])>(1, Text.equal, Text.hash);

            for((_, (content_encoding, sha256, content)) in Iter.fromArray(chunks)){
                let {chunk_id} = await frontendCanister.create_chunk({content; batch_id = batch_id_for_adding_assets;});
                let chunkIdsArray = chunksHashMap.get(content_encoding);
                
                switch(chunkIdsArray){
                    case null{ chunksHashMap.put(content_encoding, (sha256, [chunk_id])); };
                    case(?(sha256, chunk_ids_array)){
                        let buffer = Buffer.fromArray<AssetCanister.ChunkId>(chunk_ids_array);
                        buffer.add(chunk_id);
                        chunksHashMap.put(content_encoding,(sha256, Buffer.toArray(buffer)));
                    };
                };
            };

            let chunksArraysByContentEncoding : [(AssetCanister.Content_encoding, (AssetCanister.Sha256,[AssetCanister.ChunkId]))] = 
            Iter.toArray(chunksHashMap.entries());

            for((content_encoding, (sha256, chunk_ids)) in Iter.fromArray(chunksArraysByContentEncoding)){
                batchOperationsBuffer.add(#SetAssetContent({ key; sha256; chunk_ids; content_encoding;}));
            };
        };
        let operations = Buffer.toArray(batchOperationsBuffer);
        await frontendCanister.commit_batch({ batch_id = batch_id_for_adding_assets; operations; });
        return operations;
    };

    public func installCode_ (argument: ?Principal, wasm_module: Blob, canister_id: Principal, mode: {#upgrade: ?{skip_pre_upgrade: ?Bool}; #install; #reinstall}) : async () {
        let arg = switch(argument){ case null { to_candid(null) }; case (?argument_){ to_candid(argument_); } };
        let currentSnapshots = await ic.list_canister_snapshots({canister_id});
        let mostRecentCanisterSnapshot: ?IC.snapshot_id = switch(Array.size(currentSnapshots) > 0){ case true { ?currentSnapshots[0].id }; case false { null }; };
        ignore await ic.take_canister_snapshot({canister_id; replace_snapshot = mostRecentCanisterSnapshot});
        await ic.stop_canister({canister_id});
        await ic.install_code({
            arg;
            wasm_module;
            mode;
            canister_id;
            sender_canister_version = null;
        });
        await ic.start_canister({canister_id});
    };
}