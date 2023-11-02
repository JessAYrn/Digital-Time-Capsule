import MainTypes "../Types/Main/types";
import Account "../Ledger/Account";
import Result "mo:base/Result";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import JournalTypes "../Types/Journal/types";
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
        if(numberOfBlocks == 0){ return newStartIndexForNextQuery; };
        var index = 0;
        while(index < numberOfBlocks){
            let {transaction} = blocks[index];
            let {operation} = transaction;
            switch(operation){
                case null {};
                case(? existingOperation){
                    switch(existingOperation){
                        case(#Transfer({to; from; amount; fee;})){
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
                                        let tx_from : JournalTypes.Transaction = {
                                            balanceDelta = amount.e8s + fee.e8s;
                                            increase = false;
                                            recipient = to;
                                            timeStamp = timeOfCreation;
                                            source = from;
                                        };
                                        let tx_to : JournalTypes.Transaction = {
                                            balanceDelta = amount.e8s;
                                            increase = true;
                                            recipient = to;
                                            timeStamp = timeOfCreation;
                                            source = from;
                                        };
                                        if( Blob.equal(existingUAID, from) and Blob.equal(existingUAID, to)){
                                            ignore userJournal.updateTxHistory(timeOfCreation,tx_from);
                                            ignore userJournal.updateTxHistory(timeOfCreation + 1, tx_to);
                                        } else if(Blob.equal(existingUAID, from) == true){
                                            ignore userJournal.updateTxHistory(timeOfCreation,tx_from);
                                        } else if(Blob.equal(existingUAID, to) == true){                                    
                                            ignore userJournal.updateTxHistory(timeOfCreation,tx_to);
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