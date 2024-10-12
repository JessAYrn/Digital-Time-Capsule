import Governance "../../NNS/Governance";
import IC "../../Types/IC/types";
import EcdsaHelperMethods "../ECDSA/ECDSAHelperMethods";
import Account "../../Serializers/Account";
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Ledger "../../NNS/Ledger";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import RepresentationIndependentHash "../../Hash/RepresentationIndependentHash";
import Value "../../Serializers/CBOR/Value";
import TreasuryTypes "../../Types/Treasury/types";
import Decoder "../../Serializers/CBOR/Decoder";

module {

    let EMPTY : Nat64 = 0;
    let FORK : Nat64 = 1;
    let LABELED : Nat64 = 2;
    let LEAF : Nat64 = 3;
    public type Path = [Blob];
    public type Tree = [Value.Value];
    let ledger : Ledger.Interface = actor (Ledger.CANISTER_ID);
    let txFee : Nat64 = 10_000;
    public type TransformFnSignature = query { response : IC.http_response; context: Blob } -> async IC.http_response;

    public func transferIcpToNeuron( amount: Nat64, memoOrNeuronSubaccountId: {#Memo: Nat64; #NeuronSubaccountId: Blob}, senderSubaccount: Account.Subaccount, controller: Principal): async {amountSent: Nat64} {
        if(amount < 10_000){ return {amountSent: Nat64 = 0}; };
        let (memo, treasuryNeuronSubaccountId) = switch(memoOrNeuronSubaccountId){
            case(#Memo(memo)) { (memo, Account.neuronSubaccount(controller, memo)); };
            case(#NeuronSubaccountId(subaccount)) { let memo: Nat64 = 0; (memo, subaccount) };
        };
        let treasuryNeuronAccountId = Account.accountIdentifier(Principal.fromText(Governance.CANISTER_ID), treasuryNeuronSubaccountId);
        var amountSent = amount - txFee;
        var transferInput = {memo;
          from_subaccount = ?senderSubaccount;
          to = treasuryNeuronAccountId;
          amount = { e8s = amountSent };
          fee = { e8s = txFee };
          created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
        };
        let res = await ledger.transfer(transferInput);
        switch(res){
            case(#Ok(_)) { return {amountSent} };
            case(#Err(#InsufficientFunds { balance })) { 
                if(balance.e8s < 10_000){ return {amountSent: Nat64 = 0} };
                amountSent := balance.e8s - txFee;
                let res = await ledger.transfer({transferInput with amount = { e8s = amountSent }}); 
                switch(res){
                    case(#Ok(_)) { return {amountSent} };
                    case(#Err(_)) { return {amountSent: Nat64 = 0} };
                };
            };
            case(#Err(_)) { return {amountSent: Nat64 = 0}  };
        };
    };

    public func manageNeuron( input : TreasuryTypes.ManageNeuronInput): async TreasuryTypes.UnprocessedHttpResponseAndRequestId{
        let {args; selfAuthPrincipal; public_key; transformFn} = input;
        let sender = selfAuthPrincipal;
        let canister_id: Principal = Principal.fromText(Governance.CANISTER_ID);
        let method_name: Text = "manage_neuron";
        let request = EcdsaHelperMethods.prepareCanisterCallViaEcdsa({sender; public_key; canister_id; args = to_candid(args); method_name;});
        let {envelopeCborEncoded} = await EcdsaHelperMethods.getSignedEnvelope(request);
        let headers = [ {name = "content-type"; value= "application/cbor"}];
        let {request_url = url; envelope_content} = request;
        let body = ?Blob.fromArray(envelopeCborEncoded);
        let method = #post;
        let max_response_bytes: ?Nat64 = ?Nat64.fromNat(1024 * 1024);
        let transform = ?{ function = transformFn; context = Blob.fromArray([]); };
        let ic : IC.Self = actor("aaaaa-aa");
        let http_request = {body; url; headers; transform; method; max_response_bytes};
        Cycles.add<system>(20_949_972_000);
        let {status; body = responseBody; headers = headers_;} : IC.http_response = await ic.http_request(http_request);
        let response = { status; body = responseBody; headers = headers_; };
        let envelopeContentInMajorType5Format = EcdsaHelperMethods.formatEnvelopeContentForRepIndHash(envelope_content);
        let {ingress_expiry} = envelope_content;
        let requestId: Blob = Blob.fromArray(RepresentationIndependentHash.hash_val(envelopeContentInMajorType5Format));
        return {response; requestId; ingress_expiry;};
    };

    public func getNeuronData(input: TreasuryTypes.GetNeuronDataInput): async TreasuryTypes.UnprocessedHttpResponseAndRequestId{
        let {args; selfAuthPrincipal; public_key; transformFn; method_name} = input;
        let sender = selfAuthPrincipal;
        let canister_id: Principal = Principal.fromText(Governance.CANISTER_ID);
        let request = EcdsaHelperMethods.prepareCanisterCallViaEcdsa({sender; public_key; canister_id; args = to_candid(args); method_name;});
        let {envelopeCborEncoded} = await EcdsaHelperMethods.getSignedEnvelope(request);
        let headers = [ {name = "content-type"; value= "application/cbor"}];
        let {request_url = url; envelope_content} = request;
        let body = ?Blob.fromArray(envelopeCborEncoded);
        let method = #post;
        let max_response_bytes: ?Nat64 = ?Nat64.fromNat(1024 * 1024);
        let transform = ?{ function = transformFn; context = Blob.fromArray([]); };
        let ic : IC.Self = actor("aaaaa-aa");
        let http_request = {body; url; headers; transform; method; max_response_bytes};
        Cycles.add<system>(20_949_972_000);
        let {status; body = responseBody; headers = headers_;} : IC.http_response = await ic.http_request(http_request);
        let response = { status; body = responseBody; headers = headers_; };
        let envelopeContentInMajorType5Format = EcdsaHelperMethods.formatEnvelopeContentForRepIndHash(envelope_content);
        let {ingress_expiry} = envelope_content;
        let requestId: Blob = Blob.fromArray(RepresentationIndependentHash.hash_val(envelopeContentInMajorType5Format));
        return {response; requestId; ingress_expiry;};
    };

    public func readRequestState(paths: [[Blob]], selfAuthPrincipal: Principal, public_key: Blob, transformFn: TransformFnSignature): async IC.http_response {
        let sender = selfAuthPrincipal;
        let canister_id: Principal = Principal.fromText(Governance.CANISTER_ID);
        let request = EcdsaHelperMethods.prepareCanisterReadStateCallViaEcdsa({sender; canister_id; paths; public_key;});
        let {envelopeCborEncoded} = await EcdsaHelperMethods.getSignedEnvelopeReadState(request);
        let headers = [ {name = "content-type"; value= "application/cbor"}];
        let {request_url = url; } = request;
        let body = ?Blob.fromArray(envelopeCborEncoded);
        let method = #post;
        let max_response_bytes: ?Nat64 = ?Nat64.fromNat(1024 * 1024);
        let transform_context = { function = transformFn; context = Blob.fromArray([]); };
        let transform = ?transform_context;
        let ic : IC.Self = actor("aaaaa-aa");
        let http_request = {body; url; headers; transform; method; max_response_bytes};
        Cycles.add<system>(20_949_972_000);
        let response : IC.http_response = await ic.http_request(http_request);
        return response;
    };

    public func readRequestResponse(cachedRequestInfo: TreasuryTypes.ReadRequestInput, selfAuthPrincipal: Principal, public_key: Blob, transformFn: TransformFnSignature, numberOfFailedAttempts: Nat): 
    async TreasuryTypes.ReadRequestResponseOutput {
        if(numberOfFailedAttempts > 2) { return #Error({error_message = "Request failed after 3 attempts"; error_type = 0}) };
        let {requestId; expiry; expectedResponseType} = cachedRequestInfo;
        if(Nat64.toNat(expiry) < Time.now()) { return #Error({error_message = "Request expired"; error_type = 0}) };
        let response = try {
            let path = [Text.encodeUtf8("request_status"),requestId, Text.encodeUtf8("reply")];
            let {body} = await readRequestState([path], selfAuthPrincipal, public_key, transformFn);
            switch(from_response_blob(body)){
                case (#err(e)) { return #Error({error_message = "Certificate retrieval unsuccessful: "#e; error_type = 0}) };
                case(#ok(cert)){
                    switch(cert.lookup(path)){
                        case(null) { return #Error({error_message = "Request lookup unsuccessful"; error_type = 0}) };
                        case(?replyEncoded) {
                            switch(expectedResponseType){
                                case(#GovernanceResult_2{neuronId;}) {
                                    let ?reply: ?Governance.Result_2 = from_candid(replyEncoded) else { return #Error({error_message = "Decoding Failed"; error_type = 0}) };
                                    #GovernanceResult_2({response = reply; neuronId;});
                                };
                                case(#GovernanceResult_5({ neuronId;})){
                                    let ?reply: ?Governance.Result_5 = from_candid(replyEncoded) else { return #Error({error_message = "Decoding Failed"; error_type = 0}) };
                                    #GovernanceResult_5({response = reply; neuronId;});
                                };
                                case(#GovernanceManageNeuronResponse({memo; neuronId; proposer; treasuryCanisterId})){
                                    let ?reply: ?Governance.ManageNeuronResponse = from_candid(replyEncoded) else { return #Error({error_message = "Decoding Failed"; error_type = 0}) };
                                    let ?command = reply.command else { return #Error({error_message = "Decoding Failed"; error_type = 0}) };
                                    switch(command){
                                        case(#ClaimOrRefresh({refreshed_neuron_id})) { 
                                            let ?neuronId_ = refreshed_neuron_id else { return #Error({error_message = "No neuron id returned"; error_type = 0});};
                                            let neuronId = neuronId_.id;
                                            #ClaimOrRefresh({neuronId; memo;}) 
                                        };
                                        case(#Disburse({transfer_block_height})) { 
                                            let ?neuronId_ = neuronId else { return #Error({error_message = "No neuron id found"; error_type = 0}) };
                                            let ?proposer_ = proposer else { return #Error({error_message = "No proposer found"; error_type = 0}) };
                                            let ?treasuryCanisterId_ = treasuryCanisterId else { return #Error({error_message = "No treasury canister id found"; error_type = 0}) };
                                            #Disburse({transfer_block_height; neuronId = neuronId_; treasuryCanisterId = treasuryCanisterId_}) 
                                        };
                                        case(#Spawn({created_neuron_id})) { 
                                            let ?neuronId_ = neuronId else { return #Error({error_message = "No neuron id found"; error_type = 0}) };
                                            let ?new_neuron_id = created_neuron_id else { return #Error({error_message = "No neuron id returned"; error_type = 0}) };
                                            #Spawn({created_neuron_id = new_neuron_id.id; neuronId = neuronId_;}) 
                                        };
                                        case(#Follow(_)) { 
                                            let ?neuronId_ = neuronId else { return #Error({error_message = "No neuron id found"; error_type = 0}) };
                                            #Follow({ neuronId = neuronId_;}) 
                                        };
                                        case(#Configure(_)) { 
                                            let ?neuronId_ = neuronId else { return #Error({error_message = "No neuron id found"; error_type = 0}) };
                                            #Configure({neuronId = neuronId_;}) 
                                        };
                                        case(#Error({error_message; error_type})) { #Error({error_message; error_type}) };
                                        case(_) { return #Error({error_message = "Unexpected command type"; error_type = 0}) };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        } catch(e) { return await readRequestResponse(cachedRequestInfo, selfAuthPrincipal, public_key, transformFn, numberOfFailedAttempts + 1); };
        return response;
    };

    public func from_response_blob(response: Blob): Result.Result<Certificate, Text> {
        let ?content_map = get_content_map( response ) else { return #err("error in from_response_blob() at position: 0") };
        for ( field in content_map.vals() ){
            switch( field.0 ){
            case( #majorType3 name ) if ( name == "certificate" ){
                let #majorType2( arr ) = field.1 else { return #err("1") };
                let ?cert_map = get_content_map( Blob.fromArray( arr ) ) else { return #err("error in from_response_blob() at position: 2") };
                for ( entry in cert_map.vals() ) {
                switch( entry.0 ){
                    case( #majorType3 e_name ) if ( e_name == "tree" ){
                    let #majorType4( elems ) = entry.1 else { return #err("error in from_response_blob() at position: 3") };
                    return #ok(Certificate( elems ));
                    };
                    case _ ();
                };
                }
            };
            case _ ();
            }
        };
        #err("error in from_response_blob() at position: 4")
    };

    public func get_content_map(blob: Blob): ?[(Value.Value,Value.Value)] {
        let #ok( cbor ) = Decoder.decode( blob ) else { return null };
        let #majorType6( rec ) = cbor else { return null };
        if ( rec.tag != 55_799 ) return null;
        let #majorType5( map ) = rec.value else { return null };
        ?map
    };

    public class Certificate(tree: Tree) = {
        public func lookup(path: Path) : ?Blob = lookup_path(path, tree, 0, path.size());
        func lookup_path(path: Path, tree: Tree, offset: Nat, size: Nat): ?Blob {
            let #majorType0( tag ) = tree[0] else { Debug.trap("error in lookup_path() function at position: 0") };
            if ( size == 0 ){
                if ( tag == LEAF ){
                    let #majorType2( bytes ) = tree[1] else { Debug.trap("error in lookup_path() function at position: 1") };
                    return ?Blob.fromArray( bytes )
                } else Debug.trap("error in lookup_path() function at position: 2");
            };
            switch( find_label(path[offset], flatten_forks(tree)) ){
                case( ?t ) lookup_path(path, t, offset+1, size-1);
                case null Debug.trap("error in lookup_path() function at position: 3")
            }
        };
        func flatten_forks(t: Tree): [Tree] {
            let #majorType0( tag ) = t[0] else { return [] };
            if( tag == EMPTY ) []
            else if ( tag == FORK ){
                let #majorType4( l_val ) = t[1] else { return [] };
                let #majorType4( r_val ) = t[2] else { return [] };
                let buffer = Buffer.fromArray<Tree>( flatten_forks( l_val ) );
                buffer.append( Buffer.fromArray<Tree>( flatten_forks( r_val ) ) );
                Buffer.toArray( buffer )
            }
            else [t]
        };
        func find_label(key: Blob, trees: [Tree]): ?Tree {
            if ( trees.size() == 0 ) return null;
            for ( tree in trees.vals() ){
                let #majorType0( tag ) = tree[0] else { return null };
                if ( tag == LABELED ){
                    let #majorType2( bytes ) = tree[1] else { return null };
                    let label_ : Blob = Blob.fromArray( bytes );
                    if ( label_ == key ){
                        let #majorType4( labeled_tree ) = tree[2] else { return null };
                        return ?labeled_tree
                    }
                }
            };
            null
        };
    };
};
