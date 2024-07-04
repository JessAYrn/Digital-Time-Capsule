import Sha256 "../Hash/SHA256";
import Text "mo:base/Text";
import Nat8 "mo:base/Nat8";
import Blob "mo:base/Blob";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import IntX "../MotokoNumbers/IntX";

module {
  /// The Type used to express ICRC3 values
  public type Value = { 
    #Blob : Blob; 
    #Text : Text; 
    #Nat : Nat;
    #Int : Int;
    #Array : [Value]; 
    #Map : [(Text, Value)]; 
  };

  // Also see https://github.com/dfinity/ic-hs/blob/master/src/IC/HTTP/RequestId.hs

  ///Creates the represntatinally independent hash of a Value
  public func hash_val(v : Value) : [Nat8] {
    encode_val(v) |> Sha256.sha256(_)
  };

  func encode_val(v : Value) : [Nat8] {
    switch (v) {
      case (#Blob(b))   { Blob.toArray(b) };
      case (#Text(t)) { Blob.toArray(Text.encodeUtf8(t)) };
      case (#Nat(n))    { leb128(n) };
      case (#Int(i))    { sleb128(i) };
      case (#Array(a))  { arrayConcat(Iter.map(a.vals(), hash_val)); };
      case (#Map(m))    {
        let entries : Buffer.Buffer<Blob> = Buffer.fromIter(Iter.map(m.vals(), func ((k : Text, v : Value)) : Blob {
            Blob.fromArray(arrayConcat([ hash_val(#Text(k)), hash_val(v) ].vals()));
        }));
        entries.sort(Blob.compare); // No Array.compare, so go through blob
        arrayConcat(Iter.map(entries.vals(), Blob.toArray));
      }
    }
  };

  func leb128(nat : Nat) : [Nat8] {
    var n = nat;
    let buf = Buffer.Buffer<Nat8>(1);
    loop {
      if (n <= 127) {
        buf.add(Nat8.fromNat(n));
        return Buffer.toArray(buf);
      };
      buf.add(Nat8.fromIntWrap(n) | 0x80);
      n /= 128;
    }
  };

  func sleb128(i : Int) : [Nat8] {
    let aBuf = Buffer.Buffer<Nat8>(1);
    IntX.encodeInt(aBuf, i, #signedLEB128);

    Buffer.toArray(aBuf);
  };

  // func h(b1 : Blob) : Blob {
  //   Blob.toArray(b1) |> Sha256.sha256(_) |> Blob.fromArray(_);
  // };

  // Array concat
  func arrayConcat<X>(as : Iter.Iter<[X]>) : [X] {
    let buf = Buffer.Buffer<X>(1);
    for(thisItem in as){
        buf.append(Buffer.fromIter<X>(thisItem.vals()));
    };
    Buffer.toArray(buf);
  };
};
