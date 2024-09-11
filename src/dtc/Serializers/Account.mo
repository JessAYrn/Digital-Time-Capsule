import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import SHA224 "../Hash/SHA224";
import SHA256 "../Hash/SHA256";
import CRC32 "./CRC32";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Random "mo:base/Random";

module {
  // 32-byte array.
  public type AccountIdentifier = Blob;
  // 32-byte array.
  public type Subaccount = Blob;

  func beBytes32to8(n: Nat32) : [Nat8] {
    func byte(n: Nat32) : Nat8 {
      Nat8.fromNat(Nat32.toNat(n & 0xff))
    };
    [byte(n >> 24), byte(n >> 16), byte(n >> 8), byte(n)]
  };

  func beBytes64to8(n: Nat64) : [Nat8] {
    func byte(n: Nat64) : Nat8 {
      Nat8.fromNat(Nat64.toNat(n & 0xff))
    };
    [byte(n >> 56), byte(n >> 48),byte(n >> 40),byte(n >> 32),byte(n >> 24), byte(n >> 16), byte(n >> 8), byte(n)]
  };

  public func defaultSubaccount() : Subaccount {
    Blob.fromArrayMut(Array.init(32, 0 : Nat8))
  };

  public func getRandomSubaccount() : async Subaccount {
    let random = Random.Finite(await Random.blob());

    let ArrayBuffer = Buffer.Buffer<Nat8>(32);
    while (ArrayBuffer.size() < 32) {
      let ?byte: ?Nat8 = random.byte() else { Debug.trap("Failed to get random byte") };
      ArrayBuffer.add(byte);
    };

    Blob.fromArray(Buffer.toArray(ArrayBuffer))
  };


  public func accountIdentifier(principal: Principal, subaccount: Subaccount) : AccountIdentifier {
    let hash = SHA224.Digest();
    hash.write([0x0A]);
    hash.write(Blob.toArray(Text.encodeUtf8("account-id")));
    hash.write(Blob.toArray(Principal.toBlob(principal)));
    hash.write(Blob.toArray(subaccount));
    let hashSum = hash.sum();
    let crc32Bytes = beBytes32to8(CRC32.ofArray(hashSum));
    Blob.fromArray(Array.append(crc32Bytes, hashSum));
  };

  public func neuronSubaccount(principal: Principal, memo: Nat64) : AccountIdentifier {
    let hash = SHA256.Digest();
    hash.write([0x0C]);
    hash.write(Blob.toArray(Text.encodeUtf8("neuron-stake")));
    hash.write(Blob.toArray(Principal.toBlob(principal)));
    hash.write(beBytes64to8(memo));
    let hashSum = hash.sum();
    Blob.fromArray(hashSum);
  };

  public func getSelfAuthenticatingPrincipal(public_key: Blob): { principalAsBlob : Blob } {
    let hash = SHA224.sha224(Blob.toArray(public_key));
    let tag : [Nat8] = [0x02];
    { principalAsBlob = Blob.fromArray(Array.append(hash, tag)) };
  };

  public func getSelfAuthenticatingPrincipal2(public_key: [Nat8]): { principalAsArray : [Nat8] } {
    let hash = SHA224.sha224(public_key);
    let tag : [Nat8] = [0x02];
    { principalAsArray = Array.append(hash, tag) };
  };

  public func validateAccountIdentifier(accountIdentifier : AccountIdentifier) : Bool {
    if (accountIdentifier.size() != 32) {
      return false;
    };
    let a = Blob.toArray(accountIdentifier);
    let accIdPart    = Array.tabulate(28, func(i: Nat): Nat8 { a[i + 4] });
    let checksumPart = Array.tabulate(4,  func(i: Nat): Nat8 { a[i] });
    let crc32 = CRC32.ofArray(accIdPart);
    Array.equal(beBytes32to8(crc32), checksumPart, Nat8.equal)
  };
}