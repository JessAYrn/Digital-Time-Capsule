import Value "../Serializers/CBOR/Value";
import Encoder "../Serializers/CBOR/Encoder";
import Error "mo:base/Error";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Order "mo:base/Order";
import Sha256 "../Hash/SHA256";
import IntX "../MotokoNumbers/IntX";
import NatX "../MotokoNumbers/NatX";

module{

    public func sleb128(i : Int) : [Nat8] {
        let aBuf = Buffer.Buffer<Nat8>(1);
        IntX.encodeInt(aBuf, i, #signedLEB128);

        Buffer.toArray(aBuf);
    };

    public func leb128(nat : Nat) : [Nat8] {
        let aBuf = Buffer.Buffer<Nat8>(1);
        NatX.encodeNat(aBuf, nat, #unsignedLEB128);
        Buffer.toArray(aBuf);
    };

    public func getKeyValueHashes(row: (Value.Value, Value.Value)): ([Nat8], [Nat8]) {
        let (key, value) = row;
        switch(key){
            case(#majorType3(key_)){
                let keyAsciiForm = Blob.toArray(Text.encodeUtf8(key_));
                let keyHash = Sha256.sha256(keyAsciiForm);
                switch(value){
                    case(#majorType0(v)){ let valueHash = Sha256.sha256(leb128(Nat64.toNat(v))); return (keyHash, valueHash); };
                    case(#majorType1(v)){ let valueHash = Sha256.sha256(sleb128(v)); return (keyHash, valueHash); };
                    case(#majorType2(v)){ let valueHash = Sha256.sha256(v); return (keyHash, valueHash); };
                    case(#majorType3(v)){ let valueHash = Sha256.sha256(Blob.toArray(Text.encodeUtf8(v))); return (keyHash, valueHash); };
                    case(#majorType5(v)){ let valueHash = Sha256.sha256(getRepIndHash(v)); return (keyHash, valueHash); };
                    case(_){ return ([],[])};
                };
            };
            case(_){ return ([],[])};
        };
    };
    
    public func getRepIndHash(majorType5:  [(Value.Value, Value.Value)]): [Nat8]{
        let keyValueHashesMapBuffer = Buffer.Buffer<([Nat8], [Nat8])>(1);
        let majorTypeAsIter = Iter.fromArray<(Value.Value, Value.Value)>(majorType5);
        Iter.iterate<(Value.Value, Value.Value)>(majorTypeAsIter, func (row: (Value.Value, Value.Value), index : Nat){
            let (key_hash, value_hash) = getKeyValueHashes(row); 
            keyValueHashesMapBuffer.add((key_hash, value_hash));
        });
        keyValueHashesMapBuffer.sort(func (concat_a: ([Nat8],[Nat8]), concat_b: ([Nat8],[Nat8])): Order.Order{ 
            if(Blob.equal(Blob.fromArray(concat_a.0), Blob.fromArray(concat_b.0))){
                return Blob.compare(Blob.fromArray(concat_a.1), Blob.fromArray(concat_b.1));
            } else { Blob.compare(Blob.fromArray(concat_a.0), Blob.fromArray(concat_b.0)) };
        });
        let concatenationsArray = Buffer.map<([Nat8], [Nat8]), [Nat8]>(
            keyValueHashesMapBuffer, 
            func ((keyHash, valueHash): ([Nat8], [Nat8])): [Nat8]{ return Array.append(keyHash, valueHash); }
        );
        let concatenationOfSortedConcatenations = Array.flatten(Buffer.toArray(concatenationsArray));
        let repIndHash = Sha256.sha256(concatenationOfSortedConcatenations);
    };
};