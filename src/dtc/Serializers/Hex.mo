import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Char "mo:base/Char";
import Nat8 "mo:base/Nat8";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Error "mo:base/Error";
import Buffer "mo:base/Buffer";
import Order "mo:base/Order";
import Int "mo:base/Int";

module {

  private let symbols = [
    '0', '1', '2', '3', '4', '5', '6', '7',
    '8', '9', 'a', 'b', 'c', 'd', 'e', 'f',
  ];
  private let base : Nat8 = 0x10;

  public func encode(array : [Nat8]) : Text {
    func nat8ToText(u8: Nat8) : Text {
      let c1 = symbols[Nat8.toNat((u8/base))];
      let c2 = symbols[Nat8.toNat((u8%base))];
      return Char.toText(c1) # Char.toText(c2);
    };
    Array.foldLeft<Nat8, Text>(array, "", func (accum, u8) {
      accum # nat8ToText(u8);
    });
  };
  /* credit https://github.com/dfinance-tech/motoko-token/blob/ledger/src/Utils.mo */
  public func decode(t : Text) : [Nat8] {
    var map = HashMap.HashMap<Nat, Nat8>(1, Nat.equal, Hash.hash);
    // '0': 48 -> 0; '9': 57 -> 9
    for (num in Iter.range(48, 57)) {
        map.put(num, Nat8.fromNat(num-48));
    };
    // 'a': 97 -> 10; 'f': 102 -> 15
    for (lowcase in Iter.range(97, 102)) {
        map.put(lowcase, Nat8.fromNat(lowcase-97+10));
    };
    // 'A': 65 -> 10; 'F': 70 -> 15
    for (uppercase in Iter.range(65, 70)) {
        map.put(uppercase, Nat8.fromNat(uppercase-65+10));
    };
    let p = Iter.toArray(Iter.map(Text.toIter(t), func (x: Char) : Nat { Nat32.toNat(Char.toNat32(x)) }));
    var res : [var Nat8] = [var];       
    for (i in Iter.range(0, 31)) {            
        let a = Option.unwrap(map.get(p[i*2]));
        let b = Option.unwrap(map.get(p[i*2 + 1]));
        let c = 16*a + b;
        res := Array.thaw(Array.append(Array.freeze(res), Array.make(c)));
    };
    let result = Array.freeze(res);
    return result;
  };

  public func toNat(hex: Text): async Nat {
    var num = 0;
    let hexCharArray = Text.toArray(hex);
    let hexCharArrayIter = Iter.fromArray<Char>(Array.reverse(hexCharArray));
    var error : Bool = false;
    Iter.iterate<Char>(hexCharArrayIter, func (char: Char, index: Nat){
      var digit: Nat = 0;
      switch(Nat.fromText(Text.fromChar(char))){ 
        case null { 
          if(char == 'A' or char == 'a'){digit := 10 }
          else if(char == 'B' or char == 'b'){digit := 11 }
          else if(char == 'C' or char == 'c'){digit := 12 }
          else if(char == 'D' or char == 'd'){digit := 13 }
          else if(char == 'E' or char == 'e'){digit := 14 }
          else if(char == 'F' or char == 'f'){digit := 15 }
          else error := true;
        }; 
        case (?nat) {digit := nat}; 
        };
      num += digit * ( 16 ** index );
    });
    if(error) { throw Error.reject("Failed to convert hexadecimal to decimal")};
    return num;
  };

  public func toHex(nat: Nat): Text {
    func highestPowerOf16(num: Nat): Nat { 
      var power: Nat = 0; 
      while(16 ** power <= num){ power += 1; }; 
      power -= 1; 
      return power; 
    };
    func highestMultipleOf(num: Nat, factor: Nat): Nat { 
      var multiple: Nat = 0;  
      while(factor * multiple <= num){ multiple += 1; }; 
      multiple -= 1; 
      return multiple; 
    };
    var largestPower : Nat = 0;
    let hexMap = HashMap.HashMap<Nat,Text>(1, Nat.equal, Hash.hash);
    var num : Nat = nat;
    while(num > 0){
      let power = highestPowerOf16(num);
      let coefficient = highestMultipleOf(num, 16 ** power);
      if(coefficient <= 9) { hexMap.put(power, Nat.toText(coefficient)) }
      else if(coefficient == 10) hexMap.put(power, "A")
      else if(coefficient == 11) hexMap.put(power, "B")
      else if(coefficient == 12) hexMap.put(power, "C")
      else if(coefficient == 13) hexMap.put(power, "D")
      else if(coefficient == 14) hexMap.put(power, "E")
      else if(coefficient == 15) hexMap.put(power, "F");
      if(power > largestPower) largestPower := power;
      num -= coefficient * (16 ** power);
    };
    var index: Int = largestPower;
    while(index >= 0){
      let val = hexMap.get(Int.abs(index));
      switch(val){ case null {hexMap.put(Int.abs(index), "0")}; case(?v){}};
      index -= 1;
    };
    let hexMapBuffer = Buffer.fromIter<(Nat,Text)>(hexMap.entries());
    hexMapBuffer.sort(func (( (placeValue_1, digit_1) : (Nat, Text), ((placeValue_2, digit_2) : (Nat, Text)))): Order.Order{
      if(placeValue_1 > placeValue_2) return #less
      else if (placeValue_1 < placeValue_2) return #greater
      else return #equal;
    });
    let hexBuffer = Buffer.map<(Nat,Text), Text>(hexMapBuffer, func ((placeValue, digit) : (Nat, Text)): Text { return digit; });
    convertTextArrayToText(hexBuffer.toArray());
  };

  public func convertTextArrayToText(charArray: [Text]): Text {
      var text : Text = "";
      let iter = Iter.fromArray<Text>(charArray);
      Iter.iterate<Text>(iter, func (char: Text, index: Nat){ text := Text.concat(text, char); });
      return text;
  };

  public func convertCharArrayToText(charArray: [Char]): Text {
      var text : Text = "";
      let iter = Iter.fromArray<Char>(charArray);
      Iter.iterate<Char>(iter, func (char: Char, index: Nat){ text := Text.concat(text, Char.toText(char)); }); 
      return text;
  };

  public func padHex(digit: Text, hex: Text, length: Nat): Text {
    let hexAsCharArray: [Char] = Text.toArray(hex);
    var hexLength = hexAsCharArray.size();
    let hexCharBuffer = Buffer.fromArray<Char>(hexAsCharArray);
    Buffer.reverse(hexCharBuffer);
    while(hexLength < length){
      hexCharBuffer.append(Buffer.fromArray<Char>(Text.toArray(digit)));
      hexLength += 1;
    };
    Buffer.reverse(hexCharBuffer);
    convertCharArrayToText(hexCharBuffer.toArray());
  };
};
