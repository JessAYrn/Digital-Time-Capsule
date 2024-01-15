import MainTypes "../../Types/Main/types";
import Account "../../NNS/Account";
import Result "mo:base/Result";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import JournalTypes "../../Types/Journal/types";
import Ledger "../../NNS/Ledger";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Journal "../../Journal";
import Nat64 "mo:base/Nat64";
import Error "mo:base/Error";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Hex "../../NNS/Hex";
import Treasury "../../Treasury";

module{

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
        startIndexForBlockChainQuery: Nat64,
        metaData : {treasuryCanisterPrincipal : Text}
    ) : async (Nat64) {
        let queryBlockArgs = { start = startIndexForBlockChainQuery; length = Ledger.MAX_BLOCK_QUERY_LENGTH; };
        let {blocks; chain_length = newStartIndexForNextQuery} = await ledger.query_blocks(queryBlockArgs);
        let numberOfBlocks = Array.size(blocks);
        if(numberOfBlocks == 0){ return newStartIndexForNextQuery; };
        
        var index = 0;
        while(index < numberOfBlocks){
            let {transaction} = blocks[index];
            let {operation} = transaction;
            switch(operation){
                case null {};
                case(?operation_){
                    switch(operation_){
                        case(#Transfer({to; from; amount; fee;})){
                            let timeOfCreation = transaction.created_at_time.timestamp_nanos;
                            let userProfile_sender = findProfileWithGivenAccountId(profilesMap, from);
                            let userProfile_recipient = findProfileWithGivenAccountId(profilesMap, to);
                            switch(userProfile_sender){
                                case null {};
                                case(?userProfile_sender_){
                                    let (_, profile) = userProfile_sender_;
                                    let userJournal : Journal.Journal = actor(Principal.toText(profile.canisterId));
                                    let tx : JournalTypes.Transaction = { balanceDelta = amount.e8s + fee.e8s; increase = false; recipient = to; timeStamp = timeOfCreation; source = from; };
                                    ignore userJournal.updateTxHistory(timeOfCreation,tx);
                                };
                            };
                            switch(userProfile_recipient){
                                case null {};
                                case(?userProfile_recipient_){
                                    let (_, profile) = userProfile_recipient_;
                                    let userJournal : Journal.Journal = actor(Principal.toText(profile.canisterId));
                                    let tx : JournalTypes.Transaction = { balanceDelta = amount.e8s; increase = true; recipient = to; timeStamp = timeOfCreation; source = from; };
                                    ignore userJournal.updateTxHistory(timeOfCreation,tx);
                                };
                            };
                            let treasuryCanister : Treasury.Treasury = actor(metaData.treasuryCanisterPrincipal);
                            let recipientAsText : Text = Hex.encode(Blob.toArray(to));
                            let sourceAsText : Text = Hex.encode(Blob.toArray(from));
                            let treasuryAccountId = await treasuryCanister.canisterAccountId();
                            let treasuryAccountIdAsText = Hex.encode(Blob.toArray(treasuryAccountId));
                            if(recipientAsText == treasuryAccountIdAsText or sourceAsText == treasuryAccountIdAsText){
                                await treasuryCanister.updateTokenBalances();
                            };
                        };
                        case(#Approve(r)){};
                        case(#Burn(r)){};
                        case(#Mint(r)){};
                    };
                };
            };
            index += 1;
        };
        return newStartIndexForNextQuery;
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
                    case(? aID){ return Blob.equal(aID, accountId_) };
                }
        });
        return userProfile;
    };

};