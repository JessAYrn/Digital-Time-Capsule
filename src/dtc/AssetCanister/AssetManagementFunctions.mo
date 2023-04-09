import Result "mo:base/Result";
import Option "mo:base/Option";
import AssetCanister "AssetCanister";
import MainTypes "../Main/types";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
module{

    public type Error ={
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

    public func getDeleteAssetBatchOperation(key: AssetCanister.Key) : async AssetCanister.BatchOperationKind{
        return #DeleteAsset({key : AssetCanister.Key});
    };

    public func getCreateAssetBatchOperation(inputKey: AssetCanister.Key, assetArgs: AssetCanister.AssetArgs): 
    async AssetCanister.BatchOperationKind{
        let createAssetArgument : AssetCanister.CreateAssetArguments = {
            key = inputKey;
            content_type = assetArgs.content_type;
            max_age = assetArgs.max_age;
            headers = assetArgs.headers;
            enable_aliasing = assetArgs.enable_aliasing;
            allow_raw_access = assetArgs.allow_raw_access;
        };
        return #CreateAsset(createAssetArgument);
    };

    public func getSetAssetBatchOperation(
        inputKey: AssetCanister.Key, 
        assetArgs: AssetCanister.AssetArgs, 
        batchId: AssetCanister.BatchId,
        canisterData: MainTypes.CanisterData
    ): async AssetCanister.BatchOperationKind{

        let assetCanister : AssetCanister.Interface = actor(canisterData.frontEndPrincipal);
        let ChunkIds = Buffer.Buffer<(Nat)>(1);
        let numberOfChunks = assetArgs.chunks.size();
        var index = 0;
        let (content_encoding, sha256, _ ) = assetArgs.chunks[0].1;

        while(index < numberOfChunks){
            let (chunkId_, chunkData) = assetArgs.chunks[index];
            let (_, __, chunk) = chunkData;
            let {chunk_id} = await assetCanister.create_chunk({ batch_id = batchId; content = chunk });
            ChunkIds.add(chunk_id);
            index += 1;
        };

        let setAssetContentArguments = {
            key = inputKey;
            content_encoding = content_encoding;
            chunk_ids = ChunkIds.toArray();
            sha256 = sha256;
        };
        return #SetAssetContent(setAssetContentArguments);
    };


    public func getUnsetAssetBatchOperation(inputKey: AssetCanister.Key, content_encoding: Text ): 
    async AssetCanister.BatchOperationKind {
        let unsetAssetContentArguments = {
            key = inputKey;
            content_encoding = content_encoding;
        };
        return #UnsetAssetContent(unsetAssetContentArguments);
    };

    public func getClearBatchOperation(): async AssetCanister.BatchOperationKind {
        return #Clear({});
    };

    public func assembleDeleteBatchOperations(
        listFromCanister: [AssetCanister.ListResultObject],
        newAssetsMap: HashMap.HashMap<AssetCanister.Key, AssetCanister.AssetArgs>,
        batchOperations: [AssetCanister.BatchOperationKind]
    ): async [AssetCanister.BatchOperationKind]{
        var index = 0;
        let listLength = listFromCanister.size();
        let buffer = Buffer.fromIter<AssetCanister.BatchOperationKind>(Iter.fromArray(batchOperations));
        while(index < listLength){
            let listResultObject = listFromCanister[index];
            let {key} = listResultObject;
            let newAssetMetaData = newAssetsMap.get(key);
            switch(newAssetMetaData){
                case null{
                    let batchOperation = await getDeleteAssetBatchOperation(key);
                    buffer.add(batchOperation);
                };
                case(?value){};
            };
            index += 1;
        };
        return buffer.toArray();
    };

    public func assembleAllOtherOperations(
        listFromCanister: [AssetCanister.ListResultObject],
        newAssetsMap: HashMap.HashMap<AssetCanister.Key, AssetCanister.AssetArgs>,
        batchOperations: [AssetCanister.BatchOperationKind],
        batchId: AssetCanister.BatchId,
        canisterData: MainTypes.CanisterData
    ): async [AssetCanister.BatchOperationKind]{
        var index = 0;
        let newAssetsArray = Iter.toArray<(AssetCanister.Key, AssetCanister.AssetArgs)>(newAssetsMap.entries());
        let newAssetsArrayLength = newAssetsArray.size();
        let buffer = Buffer.fromIter<AssetCanister.BatchOperationKind>(Iter.fromArray(batchOperations));

        while(index < newAssetsArrayLength){
            let (key, assetArgs) = newAssetsArray[index];
            let {chunks} = assetArgs;
            let (chunkId, newAssetData) = chunks[0];
            let (_ , newSha256, _) = newAssetData;
            let assetMetaDataFromList = await getAssetMetaDataFromListArray(key, listFromCanister);
            
            switch(assetMetaDataFromList){
                case(#ok(assetMetaData)){
                    let {encodings; content_type} = assetMetaData;
                    let {sha256} = encodings[0];
                    if(sha256 != newSha256){
                        var index_ = 0;
                        let numberOfAssetChunks = encodings.size();
                        while(index_ < numberOfAssetChunks){
                            let {content_encoding} = encodings[index_];
                            let unsetAssetContentBatchOperation = await getUnsetAssetBatchOperation(key, content_encoding);
                            buffer.add(unsetAssetContentBatchOperation);
                            index_ += 1;
                        };
                    }; 
                };
                case(#err(e)){
                    let createBatchOperation = await getCreateAssetBatchOperation(key, assetArgs);
                    buffer.add(createBatchOperation);
                };
            };
            let setAssetBatchOperation = await getSetAssetBatchOperation(
                key, 
                assetArgs, 
                batchId,
                canisterData
            );
            buffer.add(setAssetBatchOperation);
            index += 1;
        };

        return buffer.toArray();
    };

    public func getAssetMetaDataFromListArray(inputKey: AssetCanister.Key, list: [AssetCanister.ListResultObject]): 
    async Result.Result<(AssetCanister. ListResultObject),Error >{
        var result: ? AssetCanister.ListResultObject = null;
        var index = 0;
        let listSize = list.size();
        while(index < listSize){
            let assetMetaData = list[index];
            if(assetMetaData.key == inputKey){
                result := Option.make(assetMetaData);
            };
            index += 1;
        };

        switch(result){
            case null {
                return #err(#NotFound);
            };
            case(? assetMetaData){
                return #ok(assetMetaData);
            };
        };
    };
};