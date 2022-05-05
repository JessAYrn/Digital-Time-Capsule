import Ledger "Ledger";
import LedgerCandid "LedgerCandid";
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
import Account "./Account";
import Bool "mo:base/Bool";
import Option "mo:base/Option";

shared(msg) actor class Analytics () = this {
    let callerId = msg.caller;

    type Error = {
        #NotFound;
        #AlreadyExists;
    };

    type Transaction = {
        balanceDelta: Nat64;
        recipient: ?Account.AccountIdentifier;
        timeStamp: Nat64;
        source: ?Account.AccountIdentifier;
    };


    //Application State
    //stable makes it so that the variable persists across updates to the canister
    //var refers to the data being a variable
    //profiles is the name of the variable
    //Trie.Trie is the data type. a Trie is a key/value map where Nat is the key and Profile is the data type
    // and it has been initialized as empty. hence the Trie.empty()

    private stable var ledgerTxHistory : Trie.Trie<Nat, Transaction> = Trie.empty();

    private stable var startIndexForQueary : Nat64 = 3_479_862;

    private stable var icpBalance : Ledger.ICP = { e8s = 0} ;

    private stable var txTrieIndex : Nat = 0;

    private stable var blockIndex : Nat64 = 3472818;

    private var txFee : Nat64 = 10_000;

    private var capacity = 1000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private var balance = Cycles.balance();

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    public query func getStartIndexForQueary () : async Nat64 {
        return startIndexForQueary;
    };

    public query func getLedgerTxHistory(startIndex : Nat ) : async [(Nat, Transaction)]{
        let ledgerTxHistoryIter = Trie.iter(ledgerTxHistory);
        let ArrayBuffer = Buffer.Buffer<(Nat,Transaction)>(1);

        Iter.iterate<(Nat, Transaction)>(ledgerTxHistoryIter, func(tx : (Nat, Transaction), _index) {

            if(Nat.greaterOrEqual(tx.0, startIndex) == true){
                ArrayBuffer.add(tx);
            };

        });
        let array = ArrayBuffer.toArray();
        return array;
    };

    public shared(msg) func updateLedgerTxHistory (newStartIndex : Nat64, newChainData : [Ledger.BlockArchive]) : async () {

        let newChainDataIter = Iter.fromArray(newChainData);
        
        Iter.iterate<Ledger.BlockArchive>(newChainDataIter, func(tx : Ledger.BlockArchive, _index) {

            switch(tx.transaction.operation){ 
                
                case null {

                };
                case (? operation){
                    switch(operation){
                        case(#Transfer(t)){

                            let dtcTx = {
                                balanceDelta = t.amount.e8s + t.fee.e8s;
                                recipient = ?t.to;
                                timeStamp = tx.transaction.created_at_time.timestamp_nanos;
                                source = ?t.from;
                            };

                            let (newTrie, oldTrie) = Trie.put(
                                ledgerTxHistory,
                                natKey(txTrieIndex),
                                Nat.equal,
                                dtcTx
                            );

                            ledgerTxHistory := newTrie;
                            txTrieIndex += 1;
                        };
                        case (#Mint(t)){

                        };
                        case (#Burn(t)){

                        };
                    };
                };

            };
        });

        startIndexForQueary := newStartIndex;
    };

    public shared(msg) func wallet_balance() : async Nat {
        return balance
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

    public query func canisterAccount() : async Account.AccountIdentifier {
        userAccountId()
    };

    public func canisterBalance() : async Ledger.ICP {
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