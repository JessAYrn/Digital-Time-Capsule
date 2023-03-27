import Ledger "../Ledger/Ledger";
import LedgerCandid "../Ledger/LedgerCandid";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Trie "mo:base/Trie";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Account "../Ledger/Account";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import IC "../IC/ic.types";
import ManagerTypes "manager.types";


shared(msg) actor class Manager (principal : Principal) = this {
    let callerId = msg.caller;

    private let ic : IC.Self = actor "aaaaa-aa";

    private stable var mainCanisterId : Text = Principal.toText(principal); 

    private var capacity = 1000000000000;

    private var balance = Cycles.balance();

    private let oneICP : Nat64 = 100_000_000;

    private let dummyPrincipal : Principal = Principal.fromText("2vxsx-fae");

    private let dummyBlob = Principal.toBlob(dummyPrincipal);

    private let dummyWasmData : ManagerTypes.WasmData = {
        dev = dummyPrincipal;
        wasmModule = dummyBlob;
    };

    private stable var release : ManagerTypes.Release = {
        frontend = dummyWasmData;
        backend = dummyWasmData;
        journal = dummyWasmData;
        manager = dummyWasmData;
    };

    private stable var version : Nat = 0;

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public shared(msg) func wallet_balance() : async Nat {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId ) {
            throw Error.reject("Unauthorized access.");
        };
        return balance
    };

    public shared(msg) func installCode( args: Blob, wasmModule: Blob ): async() {
        let callerId = msg.caller;
        let callerIdAsText = Principal.toText(callerId);
        let mainCanisterIdAsBlob  = Principal.fromText(mainCanisterId);
        await ic.stop_canister({canister_id = mainCanisterIdAsBlob});
        await ic.install_code({
            arg = args;
            wasm_module = wasmModule;
            mode = #upgrade;
            canister_id = mainCanisterIdAsBlob;
        });
        await ic.start_canister({canister_id = mainCanisterIdAsBlob});
    };

    // Return the cycles received up to the capacity allowed
    public func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = capacity - balance;
        let accepted = 
            if (amount <= limit) amount
            else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        balance += accepted;
        { accepted = Nat64.fromNat(accepted) };
    };


    private func userAccountId() : Account.AccountIdentifier {
        let canisterId =  Principal.fromActor(this);
        Account.accountIdentifier(canisterId, Account.defaultSubaccount())
    };

    public query(msg) func canisterAccount() : async Account.AccountIdentifier {
        let callerId = msg.caller;
        if( Principal.toText(callerId) != mainCanisterId) {
            throw Error.reject("Unauthorized access.");
        };
        userAccountId()
    };

    public shared(msg) func canisterBalance() : async Ledger.ICP {
        let callerId = msg.caller;
        let canisterId =  Principal.fromActor(this);
        if(  
            Principal.toText(callerId) !=  Principal.toText(canisterId)
            and Principal.toText(callerId) != mainCanisterId
        ) {
            throw Error.reject("Unauthorized access.");
        };
        await ledger.account_balance({ account = userAccountId() })
    };
   
    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)}
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };

    private func textKey(x: Text) : Trie.Key<Text> {
        return {key = x; hash = Text.hash(x)}
    };

}