import MainTypes "../../Types/Main/types";
import Account "../../Ledger/Account";
import Result "mo:base/Result";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import JournalTypes "../../Types/Journal/types";
import Ledger "../../Ledger/Ledger";
import LedgerCandid "../../Ledger/LedgerCandid";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Journal "../../Journal";
import Nat64 "mo:base/Nat64";
import Error "mo:base/Error";
import Array "mo:base/Array";

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
            if(transaction.operation == null) return newStartIndexForNextQuery;
            let ?operation = transaction.operation;
            switch(operation){
                case(#Transfer({to; from; amount; fee;})){
                    let timeOfCreation = transaction.created_at_time.timestamp_nanos;
                    var userProfile = findProfileWithGivenAccountId(profilesMap, to);
                    if(userProfile == null) userProfile := findProfileWithGivenAccountId(profilesMap, from);
                    if(userProfile == null) return newStartIndexForNextQuery;
                    let ?(principal, profile) = userProfile;
                    let ?accountId = profile.accountId;
                    let userJournal : Journal.Journal = actor(Principal.toText(profile.canisterId));
                    let tx_from : JournalTypes.Transaction = { balanceDelta = amount.e8s + fee.e8s; increase = false; recipient = to; timeStamp = timeOfCreation; source = from; };
                    let tx_to : JournalTypes.Transaction = { tx_from with balanceDelta = amount.e8s; increase = true; };
                    if(Blob.equal(accountId, from) == true) ignore userJournal.updateTxHistory(timeOfCreation,tx_from);
                    if(Blob.equal(accountId, to) == true) ignore userJournal.updateTxHistory(timeOfCreation,tx_to);
                };
                case(#Burn(r)){};
                case(#Mint(r)){};
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



    private func findProfileWithGivenAccountId(profilesMap: MainTypes.UserProfilesMap, accountId_: Account.AccountIdentifier)
    : ?(Principal, MainTypes.UserProfile){
        let profilesArray = Iter.toArray(profilesMap.entries());
        let userProfile = Array.find<(Principal, MainTypes.UserProfile)>(
            profilesArray, 
            func ((princpal: Principal, profile: MainTypes.UserProfile)): Bool {
                let {accountId} = profile;
                switch(accountId){
                    case null return false;
                    case(? aID){ if (Blob.equal(aID, accountId_)) return true else return false};
                }
        });
        return userProfile;
    };

};