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

    public func installCodeJournalWasms(  
        wasmModule: Blob, 
        profilesArray : MainTypes.UserProfilesArray
    ): async() {
        let profilesSize = profilesArray.size();
        var index = 0;

        while(index < profilesSize){
            let (principal, profile) = profilesArray[index];
            let arg = principal;
            ignore installCode_(?arg, wasmModule, profile.canisterId);
            index += 1;
        };
    };

    public func installCodeBackendWasm(
        backEndPrincipal: Text,
        wasmModule: Blob
    ): async (){
        let arg = null;
        let backEndPrincipalBlob = Principal.fromText(backEndPrincipal);
        await installCode_(arg, wasmModule, backEndPrincipalBlob);
    };

    public func installFrontendWasm(
        canisterData: MainTypes.CanisterData,
        wasmModule: Blob
    ): async (){
        let {frontEndPrincipal} = canisterData;
        let arg = null;
        let frontEndPrincipalBlob = Principal.fromText(frontEndPrincipal);
        await installCode_(arg, wasmModule, frontEndPrincipalBlob);
    };

    private func installCode_ (argument: ?Principal, wasm_module: Blob, canister_id: Principal) : async () {
        let arg = to_candid(argument);
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