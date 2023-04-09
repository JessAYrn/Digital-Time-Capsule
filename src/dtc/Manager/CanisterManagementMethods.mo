import MainTypes "../Main/types";
import AssetCanister "../AssetCanister/AssetCanister";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";

module{
    public func installCode_frontendCanister(canisterData: MainTypes.CanisterData, newAssets: AssetCanister.Assets): async (){
        let frontendCanisterId = canisterData.frontEndPrincipal;
        let frontendCanister: AssetCanister.Interface = actor(frontendCanisterId);
        let assetsFromFrontendCanister = await frontendCanister.list({});
        let batchId = await frontendCanister.create_batch({});
        let BatchOperations = Buffer.Buffer<(AssetCanister.BatchOperationKind)>(1);
        let newAssetsMap = HashMap.fromIter<AssetCanister.Key, AssetCanister.AssetArgs>(
            Iter.fromArray(newAssets), 
            Iter.size(Iter.fromArray(newAssets)), 
            Text.equal,
            Text.hash
        );

        


    };
}