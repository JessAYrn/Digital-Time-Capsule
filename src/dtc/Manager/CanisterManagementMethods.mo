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

module{
    
    private let ic : IC.Self = actor "aaaaa-aa";

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

    public func installFrontendWasm( appMetaData: MainTypes.AppMetaData, wasmModule: Blob): async (){
        let {frontEndPrincipal} = appMetaData;
        let frontEndPrincipalBlob = Principal.fromText(frontEndPrincipal);
        await installCode_(null, wasmModule, frontEndPrincipalBlob);
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