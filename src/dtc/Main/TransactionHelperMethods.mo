import MainTypes "types";
import Account "../Ledger/Account";
import Result "mo:base/Result";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import JournalTypes "../Journal/journal.types";
import Ledger "../Ledger/Ledger";
import LedgerCandid "../Ledger/LedgerCandid";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Journal "../Journal/Journal";
import Nat64 "mo:base/Nat64";
import Error "mo:base/Error";

module{

    private let ledgerC : LedgerCandid.Interface = actor(LedgerCandid.CANISTER_ID);
    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private let Gas: Nat64 = 10000;

    public func transferICP(callerId: Principal, profilesMap: MainTypes.UserProfilesMap ,amount: Nat64, canisterAccountId: Account.AccountIdentifier) : 
    async Result.Result<(), JournalTypes.Error> {

        let userProfile = profilesMap.get(callerId);
        switch(userProfile) {
            case null{ #err(#NotFound) }; 
            case (? profile){
                let userJournal : Journal.Journal = actor(Principal.toText(profile.canisterId));
                let icpTransferStatus = await userJournal.transferICP(amount, canisterAccountId);
                if(icpTransferStatus == true){ #ok(()); } 
                else { #err(#TxFailed); }
            };
        };
    };

    public func readTransaction(callerId: Principal, profilesMap: MainTypes.UserProfilesMap) : 
    async Result.Result<[(Nat, JournalTypes.Transaction)], JournalTypes.Error> {

        let callerProfile = profilesMap.get(callerId);

        switch(callerProfile){
            case null{ #err(#NotFound); }; 
            case ( ? profile){
                let userJournal : Journal.Journal = actor(Principal.toText(profile.canisterId));
                let tx = await userJournal.readWalletTxHistory();
                return #ok(tx);
            };
        };
    };

    public func updateUsersTxHistory(
        profilesMap: MainTypes.UserProfilesMap,
        startIndexForBlockChainQuery: Nat64
    ) : async (Nat64) {

        let tipOfChainIndex = await tipOfChainDetails();
        let newStartIndexForNextQuery = Nat64.min( tipOfChainIndex, startIndexForBlockChainQuery + LedgerCandid.maxBlockQueryLength );
        let getBlocksArgs = { start = startIndexForBlockChainQuery; length = LedgerCandid.maxBlockQueryLength; };
        let {blocks} = await ledger.query_blocks(getBlocksArgs);
        let numberOfBlocks = Iter.size(Iter.fromArray(blocks));
        var index = 0;
        while(index < numberOfBlocks){
            let block = blocks[index];
            let transaction = block.transaction;
            let operation = transaction.operation;
            switch(operation){
                case null {};
                case(? existingOperation){
                    switch(existingOperation){
                        case(#Transfer(r)){
                            let recipient = r.to;
                            let source = r.from;
                            let amount = r.amount.e8s;
                            let fee = r.fee.e8s;
                            let timeOfCreation = transaction.created_at_time.timestamp_nanos;
                            let profilesSize = profilesMap.size();
                            let profilesIter = profilesMap.entries();
                            let profilesArray = Iter.toArray(profilesIter);
                            var index_1 = 0;
                            while(index_1 < profilesSize){
                                let userProfileAndPrincipal = profilesArray[index_1];
                                let userProfile = userProfileAndPrincipal.1;
                                let userAccountId = userProfile.accountId;
                                switch(userAccountId){
                                    case null{};
                                    case(? existingUAID){
                                        let userJournal : Journal.Journal = actor(Principal.toText(userProfile.canisterId));
                                        if(Blob.equal(existingUAID, source) == true){
                                            let tx : JournalTypes.Transaction = {
                                                balanceDelta = amount + fee;
                                                increase = false;
                                                recipient = ?recipient;
                                                timeStamp = ?timeOfCreation;
                                                source = ?source;
                                            };
                                            await userJournal.updateTxHistory(tx);
                                        };
                                        if(Blob.equal(existingUAID, recipient) == true){                                    
                                            let tx : JournalTypes.Transaction = {
                                                balanceDelta = amount;
                                                increase = true;
                                                recipient = ?recipient;
                                                timeStamp = ?timeOfCreation;
                                                source = ?source;
                                            };
                                            await userJournal.updateTxHistory(tx);
                                        };
                                    };
                                };
                                index_1 += 1;
                            };
                        };
                        case(#Burn(r)){};
                        case(#Mint(r)){};
                    };
                };
            };
            index += 1;
        };
        return newStartIndexForNextQuery;
    };

    public func tipOfChainDetails() : async (Ledger.BlockIndex) {
        let tip = await ledgerC.tip_of_chain();
        switch (tip) {
            case (#Err(_)) { throw Error.reject("Tip of chain could not be read"); };
            case (#Ok(t)) { return t.tip_index; };
        };
    };



    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

};