import MainTypes "../../Types/Main/types";
import Account "../../Serializers/Account";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import JournalTypes "../../Types/Journal/types";
import Ledger "../../NNS/Ledger";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Journal "../../Journal";
import Nat64 "mo:base/Nat64";
import Array "mo:base/Array";
import Hex "../../Serializers/Hex";
import Treasury "../../Treasury";

module{

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);
    private let txFee : Nat64 = 10_000;

    public func transferICP(callerId: Principal, profilesMap: MainTypes.UserProfilesMap_V2 ,amount: Nat64, canisterAccountId: Account.AccountIdentifier) : 
    async Result.Result<({amountSent: Nat64}), JournalTypes.Error> {
        if(amount < txFee){ return #err(#TxFailed) };
        let userProfile = profilesMap.get(callerId);
        switch(userProfile) {
            case null{ #err(#NotFound) }; 
            case (? profile){
                let userJournal : Journal.Journal = actor(Principal.toText(profile.canisterId));
                let {amountSent} = await userJournal.transferICP(amount, #AccountIdentifier(canisterAccountId)); return #ok({amountSent});
            };
        };
    };

    public func updateUsersTxHistory(
        profilesMap: MainTypes.UserProfilesMap_V2,
        startIndexForBlockChainQuery: Nat64,
        metaData : {treasuryCanisterPrincipal : Text}
    ) : async (Nat64) {
        let queryBlockArgs = { start = startIndexForBlockChainQuery; length = Ledger.MAX_BLOCK_QUERY_LENGTH; };
        let {blocks; chain_length = newStartIndexForNextQuery} = await ledger.query_blocks(queryBlockArgs);
        let numberOfBlocks = Array.size(blocks);
        
        var index = 0;
        label loop_ while(index < numberOfBlocks){
            let {transaction} = blocks[index];
            let {operation} = transaction;
            let ?operation_ = operation else { index += 1; continue loop_ };
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
                    let treasuryAccountId = await treasuryCanister.canisterIcpAccountId(null);
                    let treasuryAccountIdAsText = Hex.encode(Blob.toArray(treasuryAccountId));
                    if(recipientAsText == treasuryAccountIdAsText or sourceAsText == treasuryAccountIdAsText){
                        ignore treasuryCanister.updateTokenBalances(#Principal(metaData.treasuryCanisterPrincipal),#Icp);
                    };
                };
                case(_){};
            };
            index += 1;
        };
        return newStartIndexForNextQuery;
    };

    private func findProfileWithGivenAccountId(profilesMap: MainTypes.UserProfilesMap_V2, accountId: Account.AccountIdentifier)
    : ?(Principal, MainTypes.UserProfile_V2){
        let profilesArray = Iter.toArray(profilesMap.entries());
        let userProfile = Array.find<(Principal, MainTypes.UserProfile_V2)>(
            profilesArray, 
            func ((princpal: Principal, profile: MainTypes.UserProfile_V2)): Bool {
                let ?accountId_ = profile.accountId else { return false; };
                return Blob.equal(accountId_, accountId);
            }
        );
        return userProfile;
    };

};