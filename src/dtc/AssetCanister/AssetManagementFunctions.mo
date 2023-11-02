import Result "mo:base/Result";
import Option "mo:base/Option";
import AssetCanister "../Types/AssetCanister/types";
import MainTypes "../Types/Main/types";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
module{

    public func getDeleteAssetBatchOperation(key: AssetCanister.Key) : async AssetCanister.BatchOperationKind{
        return #DeleteAsset({key : AssetCanister.Key});
    };

    public func getCreateAssetBatchOperation(createAssetArguments: AssetCanister.CreateAssetArguments): 
    async AssetCanister.BatchOperationKind{
        return #CreateAsset(createAssetArguments);
    };

    public func getSetAssetBatchOperation(setAssetContentArguments: AssetCanister.SetAssetContentArguments): 
    async AssetCanister.BatchOperationKind{
        return #SetAssetContent(setAssetContentArguments);
    };


    public func getUnsetAssetBatchOperation(key: AssetCanister.Key, content_encoding: Text ): 
    async AssetCanister.BatchOperationKind {
        let unsetAssetContentArguments = {
            key;
            content_encoding;
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

    public func getAssetMetaDataFromListArray(inputKey: AssetCanister.Key, list: [AssetCanister.ListResultObject]): 
    async Result.Result<(AssetCanister. ListResultObject),AssetCanister.Error >{
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