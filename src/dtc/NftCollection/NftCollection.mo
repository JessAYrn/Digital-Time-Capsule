import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Time "mo:base/Time";
import Principal "mo:base/Principal"; 

module {

    public let CANISTER_ID : Text = "n54f2-aiaaa-aaaap-qaseq-cai";

    public type Time = Time.Time;

    public type AccountIdentifier__1 = Text;

    public type TokenIdentifier = Text;

    public type CommonError = { #InvalidToken : TokenIdentifier; #Other : Text };

    public type Listing = { locked : ?Time; seller : Principal; price : Nat64 };

    public type TokenIndex = Nat32;

     public type Result = {
        #ok : [(Nat32, ?Listing, ?[Nat8])];
        #err : CommonError;
    };

    public type Interface = actor {
        tokens_ext : shared query AccountIdentifier__1 -> async Result;
    };

}