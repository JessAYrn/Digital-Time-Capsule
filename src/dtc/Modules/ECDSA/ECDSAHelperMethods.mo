import IC "../../Types/IC/types";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import Buffer "mo:base/Buffer";
import Sha256 "../../Hash/SHA256";
import Value "../../Serializers/CBOR/Value";
import Encoder "../../Serializers/CBOR/Encoder";
import RepresentationIndependentHash "../../Hash/RepresentationIndependentHash";
import Hex "../../Serializers/Hex";
import NatX "../../MotokoNumbers/NatX";

module{

    let IC_URL : Text =  "https://icp-api.io";
    let ic: IC.Self = actor "aaaaa-aa";

    public type EnvelopeContent = {
        ingress_expiry: Nat64;
        sender: Principal;
        canister_id: Principal;
        method_name: Text;
        arg: [Nat8];
    };

    public type EnvelopeContentReadState = {
        sender: Principal;
        paths: [[Blob]];
        ingress_expiry: Nat64;
    };

    public type Envelope = {
        content: EnvelopeContent;
        sender_pubkey: [Nat8];
        sender_sig: [Nat8];
    };

    public type CanisterEcdsaRequest = {
        request_url : Text;
        public_key : [Nat8];
        key_id: { name : Text; curve : IC.ecdsa_curve };
        envelope_content: EnvelopeContent;
    };

    public type CanisterEcdsaRequestReadState = {
        request_url : Text;
        public_key : [Nat8];
        key_id: { name : Text; curve : IC.ecdsa_curve };
        envelope_content: EnvelopeContentReadState;
    };

    public type PrepareCanisterCallViaEcdsaArgs = {
        sender: Principal;
        public_key : Blob;
        canister_id: Principal; 
        method_name: Text;
        args: Blob;
    };

    public type PrepareCanisterReadStateCallViaEcdsaArgs = {
        sender: Principal;
        public_key : Blob;
        canister_id: Principal; 
        paths: [[Blob]];
    };

    public func decompressPublicKey(compressedPublicKey: Blob): async {decompressedPublicKey: Blob; x: Text; y: Text } {
        let p_hex : Text = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F";
        let compressedPublicKeyHex : Text = Hex.encode(Blob.toArray(compressedPublicKey));
        let compressedPublicKeyHexArray : [Char] = Text.toArray(compressedPublicKeyHex);
        let prefix: Text = Hex.convertCharArrayToText([compressedPublicKeyHexArray[0], compressedPublicKeyHexArray[1]]);
        let x_hex: Text = Hex.convertCharArrayToText(Array.subArray<Char>(compressedPublicKeyHexArray, 2, compressedPublicKeyHexArray.size() - 2));
        let xAsInt: Int = await Hex.toNat(x_hex);
        let pAsInt: Nat = await Hex.toNat(p_hex);
        let pow_1 = xAsInt **3;
        let rem_1 = NatX.modulo(pow_1, pAsInt);
        let sum_1 = rem_1 + 7;
        let y_square: Int = NatX.modulo(sum_1, pAsInt);
        let sum_2 = pAsInt + 1;
        let quo_1 = Int.div(sum_2,4);
        let y_square_square_root: Int = NatX.pow_mod(Int.abs(y_square), Int.abs(quo_1), pAsInt);
        var y : Int = y_square_square_root;
        if(
            (prefix == "02" and NatX.modulo(y_square_square_root, 2) == 1) or 
            (prefix == "03" and NatX.modulo(y_square_square_root, 2) == 0)
        ){ y := NatX.modulo(-1 * y_square_square_root,  pAsInt) };
        let y_hex = Hex.padHex("0", Hex.toHex(Int.abs(y)), 64);
        let prefixNat8Array: [Nat8] = [0x04];
        let xNat8Array: [Nat8] = Hex.decode(x_hex);
        let yNat8Array: [Nat8] = Hex.decode(y_hex);
        let decompressedPublicKeyNat8Array: [Nat8] = Array.append(prefixNat8Array,xNat8Array );
        let decompressedPublicKeyNat8Array_: [Nat8] = Array.append(decompressedPublicKeyNat8Array, yNat8Array);
        { decompressedPublicKey = Blob.fromArray(decompressedPublicKeyNat8Array_); x = x_hex; y = y_hex };
    };

    public func convertToDerFormat(public_key: Blob) : async Blob {
        let pre_string : Blob = "\30\56\30\10\06\07\2a\86\48\ce\3d\02\01\06\05\2b\81\04\00\0a\03\42\00";
        let {decompressedPublicKey} = await decompressPublicKey(public_key);
        let pubKeyBuffer = Buffer.fromIter<Nat8>(Iter.fromArray<Nat8>(Blob.toArray(pre_string)));
        pubKeyBuffer.append(Buffer.fromIter<Nat8>(Iter.fromArray<Nat8>(Blob.toArray(decompressedPublicKey))));
        Blob.fromArray(Buffer.toArray(pubKeyBuffer));
    };

    public func getPublicKey(canister_id: ?Principal) : async { public_key: Blob } {
        try {
        //request the management canister to compute an ECDSA public key
        let { public_key } = await ic.ecdsa_public_key({
            //When `null`, it defaults to getting the public key of the canister that makes this call
            canister_id;
            derivation_path = [];
            key_id = { curve = #secp256k1; name = "key_1" };
        });
        { public_key = await convertToDerFormat(public_key)};
        } catch (_) { throw Error.reject("Public Key Retreival failed") };
    };

    public func prepareCanisterCallViaEcdsa(arguments: PrepareCanisterCallViaEcdsaArgs): CanisterEcdsaRequest {
        let {canister_id; sender; method_name; args; public_key} = arguments;
        let arg = Blob.toArray(args);
        let request_url : Text = IC_URL # "/api/v2/canister/" # Principal.toText(canister_id) # "/call";
        let key_id = { name : Text = "key_1"; curve : IC.ecdsa_curve = #secp256k1};
        let ingress_expiry : Nat64 = Nat64.fromNat(Int.abs(Time.now())) + (3 * 60 * 1_000_000_000);
        let envelope_content : EnvelopeContent = { ingress_expiry; canister_id; method_name; arg; sender};
        return { request_url; envelope_content; key_id; public_key = Blob.toArray(public_key) };
    };

    public func prepareCanisterReadStateCallViaEcdsa(arguments: PrepareCanisterReadStateCallViaEcdsaArgs): CanisterEcdsaRequestReadState {
        let {canister_id; sender; paths; public_key} = arguments;
        let request_url : Text = IC_URL # "/api/v2/canister/" # Principal.toText(canister_id) # "/read_state";
        let key_id = { name : Text = "key_1"; curve : IC.ecdsa_curve = #secp256k1};
        let ingress_expiry : Nat64 = Nat64.fromNat(Int.abs(Time.now())) + (3 * 60 * 1_000_000_000);
        let envelope_content : EnvelopeContentReadState = { paths; sender; ingress_expiry};
        return { request_url; envelope_content; key_id; public_key = Blob.toArray(public_key) };
    };

    public func getSignedEnvelope(request : CanisterEcdsaRequest) : 
    async {envelopeCborEncoded: [Nat8]}{
        let {envelope_content; key_id; public_key} = request;
        let envelopeContentInMajorType5Format = formatEnvelopeContentForCborEncoding(envelope_content);
        let {message_hash;} = getMessageHashForEcdsaSignature(formatEnvelopeContentForRepIndHash(envelope_content));
        Cycles.add<system>(30_000_000_000);
        let { signature } = await ic.sign_with_ecdsa({ message_hash; derivation_path = []; key_id;});
        let envelopeAsMajorType : Value.Value = #majorType5([
            (#majorType3("content"), #majorType5(envelopeContentInMajorType5Format)),
            (#majorType3("sender_pubkey"), #majorType2(public_key)),
            (#majorType3("sender_sig"), #majorType2(Blob.toArray(signature)))
        ]);
        let envelopeCborEncoded : [Nat8] = switch(Encoder.encode(envelopeAsMajorType)) {
            case (#err(_)) {throw Error.reject("envelope encoding falied") };
            case(#ok(encoding)) {encoding};
        };
        return {envelopeCborEncoded};
    };

    public func getSignedEnvelopeReadState(request : CanisterEcdsaRequestReadState) : 
    async {envelopeCborEncoded: [Nat8]}{
        let {envelope_content; key_id; public_key} = request;
        let envelopeContentInMajorType5Format = formatEnvelopeContentReadStateForCborEncoding(envelope_content);
        let {message_hash;} = getMessageHashForEcdsaSignature(formatEnvelopeContentReadStateForRepIndHash(envelope_content));
        Cycles.add<system>(30_000_000_000);
        let { signature } = await ic.sign_with_ecdsa({ message_hash; derivation_path = []; key_id; });
        let envelopeAsMajorType : Value.Value = #majorType5([
            (#majorType3("content"), #majorType5(envelopeContentInMajorType5Format)),
            (#majorType3("sender_pubkey"), #majorType2(public_key)),
            (#majorType3("sender_sig"), #majorType2(Blob.toArray(signature)))
        ]);
        let envelopeCborEncoded : [Nat8] = switch(Encoder.encode(envelopeAsMajorType)) {
            case (#err(_)) {throw Error.reject("envelope encoding falied") };
            case(#ok(encoding)) {encoding};
        };
        return {envelopeCborEncoded};
    };

    public func formatEnvelopeContentForCborEncoding(envelope_content: EnvelopeContent) : [(Value.Value, Value.Value)] {
        let { ingress_expiry; sender; canister_id; method_name; arg } = envelope_content;

        let envelopeContentInMajorType5Format : [(Value.Value, Value.Value)] = ([
            (#majorType3("request_type"), #majorType3("call")),
            (#majorType3("ingress_expiry"), #majorType0(ingress_expiry)),
            (#majorType3("method_name"), #majorType3(method_name)),
            (#majorType3("sender"), #majorType2(Blob.toArray(Principal.toBlob(sender)))),
            (#majorType3("canister_id"), #majorType2(Blob.toArray(Principal.toBlob(canister_id)))),
            (#majorType3("arg"), #majorType2(arg))
        ]);
        return envelopeContentInMajorType5Format;
    };

    public func formatEnvelopeContentReadStateForCborEncoding(envelope_content: EnvelopeContentReadState) : [(Value.Value, Value.Value)] {
        let { sender; paths; ingress_expiry } = envelope_content;
        let pathsInMajorFormatIter = Iter.map<[Blob], Value.Value>(
            Iter.fromArray<[Blob]>(paths), 
            func (path: [Blob]): Value.Value{
                let pathInMajorFormatIter = Iter.map<Blob, Value.Value>(
                    Iter.fromArray<Blob>(path), 
                    func (blob: Blob): Value.Value { #majorType2(Blob.toArray(blob)) }
                );
                #majorType4(Iter.toArray(pathInMajorFormatIter));            
            }
        );
        let pathsInMajorFormat : [Value.Value] = Iter.toArray(pathsInMajorFormatIter);
        let envelopeContentInMajorType5Format : [(Value.Value, Value.Value)] = ([
            (#majorType3("request_type"), #majorType3("read_state")),
            (#majorType3("ingress_expiry"), #majorType0(ingress_expiry)),
            (#majorType3("sender"), #majorType2(Blob.toArray(Principal.toBlob(sender)))),
            (#majorType3("paths"), #majorType4(pathsInMajorFormat))
        ]);
        return envelopeContentInMajorType5Format;
    };

    public func formatEnvelopeContentForRepIndHash(envelope_content: EnvelopeContent) : RepresentationIndependentHash.Value {
        let { ingress_expiry; sender; canister_id; method_name; arg } = envelope_content;

        let envelopeContentInRepIndHashableFormat = ([
            ("request_type", #Text("call")),
            ("ingress_expiry", #Nat(Nat64.toNat(ingress_expiry))),
            ("method_name", #Text(method_name)),
            ("sender", #Blob(Principal.toBlob(sender))),
            ("canister_id", #Blob(Principal.toBlob(canister_id))),
            ("arg", #Blob(Blob.fromArray(arg)))
        ]);

        return #Map(envelopeContentInRepIndHashableFormat);
    };

    public func formatEnvelopeContentReadStateForRepIndHash(envelope_content: EnvelopeContentReadState) : RepresentationIndependentHash.Value {
        let { sender; paths; ingress_expiry } = envelope_content;
        let pathsInValueFormat = Iter.map<[Blob], RepresentationIndependentHash.Value>(
            Iter.fromArray<[Blob]>(paths), 
            func (path: [Blob]): RepresentationIndependentHash.Value{
                let pathInValueFormat = Iter.map<Blob, RepresentationIndependentHash.Value>(
                    Iter.fromArray<Blob>(path), 
                    func (blob: Blob): RepresentationIndependentHash.Value { #Blob(blob) }
                );
                return #Array(Iter.toArray(pathInValueFormat));           
            }
        );
        
        let envelopeContentInRepIndHashableFormat : [(Text, RepresentationIndependentHash.Value)] = ([
            ("request_type", #Text("read_state")),
            ("ingress_expiry", #Nat(Nat64.toNat(ingress_expiry))),
            ("sender", #Blob(Principal.toBlob(sender))),
            ("paths", #Array(Iter.toArray(pathsInValueFormat)))
        ]);

        return #Map(envelopeContentInRepIndHashableFormat)
    };

    private func getMessageHashForEcdsaSignature(envelopeContentInMajorType5Format: RepresentationIndependentHash.Value) : {message_hash: Blob} {
        let requestId: [Nat8] = RepresentationIndependentHash.hash_val(envelopeContentInMajorType5Format);
        let prefix : [Nat8] = [0x0A];
        let domainSeparaterString : [Nat8] = Blob.toArray(Text.encodeUtf8("ic-request"));
        let IC_REQUEST_DOMAIN_SEPARATOR : [Nat8] = Array.append(prefix, domainSeparaterString);
        let signablerequestId = Sha256.sha256(Array.append(IC_REQUEST_DOMAIN_SEPARATOR, requestId));
        return {message_hash  = Blob.fromArray(signablerequestId)};
    };
    

};