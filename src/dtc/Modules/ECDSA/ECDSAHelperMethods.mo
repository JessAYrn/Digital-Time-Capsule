import IC "../../Types/IC/types";
import Principal "mo:base/Principal";
import Random "mo:base/Random";
import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import RandomNums "../Random/Random";
import Account "../../NNS/Account";
import Governance "../../NNS/Governance";

module{

    let IC_URL : Text =  "https://icp-api.io";
    let ic: IC.Self = actor "aaaaa-aa";

    public type EnvelopeContent = {
        nonce: ?[Nat8];
        ingress_expiry: Nat64;
        sender: Principal;
        canister_id: Principal;
        method_name: Text;
        arg: [Nat8];
    };

    public type CanisterEcdsaRequest = {
        request_url : Text;
        public_key : [Nat8];
        this_canister_id: Principal;
        key_id: { name : Text; curve : IC.ecdsa_curve };
        envelope_content: EnvelopeContent;
    };

    public type PrepareCanisterCallViaEcdsaArgs = {
        sender: Principal;
        public_key : Blob;
        canister_id: Principal; 
        method_name: Text;
        this_canister_id: Principal;
        args: Governance.ManageNeuron;
    };

    public func getPublicKey(canister_id: ?Principal, caller: Principal) : async { public_key: Blob } {
        try {
        //request the management canister to compute an ECDSA public key
        let { public_key } = await ic.ecdsa_public_key({
            //When `null`, it defaults to getting the public key of the canister that makes this call
            canister_id;
            derivation_path = [ Principal.toBlob(caller) ];
            //this code uses the mainnet test key
            key_id = { curve = #secp256k1; name = "key_1" };
        });
        { public_key }
        } catch (err) { throw Error.reject("Public Key Retreival failed") };
    };

    public func prepareCanisterCallViaEcdsa(arguments: PrepareCanisterCallViaEcdsaArgs): async CanisterEcdsaRequest {
        let {canister_id; sender; method_name; args; this_canister_id; public_key} = arguments;
        let arg = Blob.toArray(to_candid(args));
        let request_url : Text = IC_URL # "/api/v2/canister/" # Principal.toText(canister_id) # "/call";
        let key_id = { name : Text = "key_1"; curve : IC.ecdsa_curve = #secp256k1};
        let nonce = await RandomNums.generateNonceForECDSA();
        let ingress_expiry : Nat64 = Nat64.fromNat(Int.abs(Time.now())) + ( 5 * 1_000_000_000);
        let envelope_content : EnvelopeContent = { request_url; nonce = ?nonce; ingress_expiry; canister_id; method_name; arg; sender};
        return { request_url; envelope_content; key_id; this_canister_id; public_key = Blob.toArray(public_key) };
    };
};