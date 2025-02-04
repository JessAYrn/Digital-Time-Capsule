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
import Hex "../../Serializers/Hex";
import Treasury "../../Treasury";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";

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

    public func updateUsersTxHistoryFromNext2000Blocks( profilesMap: MainTypes.UserProfilesMap_V2, startIndexForBlockChainQuery: Nat64, metaData : {treasuryCanisterPrincipal : Text}): 
    async ({newStartIndexForNextQuery: Nat64; isCaughtUp: Bool}) {

        let accountIdsToCanisterIds = HashMap.HashMap<Account.AccountIdentifier, Principal>(0, Blob.equal, Blob.hash);

        label populatingAccountIdsToCanisterIdsMap for((principal, {canisterId; accountId}) in profilesMap.entries()){
            let ?accountId_ = accountId else { continue populatingAccountIdsToCanisterIdsMap };
            accountIdsToCanisterIds.put(accountId_, canisterId);
        };

        let {blocks; chain_length; archived_blocks} = await ledger.query_blocks({ start = startIndexForBlockChainQuery; length = Ledger.MAX_BLOCK_QUERY_LENGTH; });

        let newStartIndexForNextQuery = Nat64.min( startIndexForBlockChainQuery + Ledger.MAX_BLOCK_QUERY_LENGTH, chain_length );

        let isCaughtUp = newStartIndexForNextQuery == chain_length;

        let BlocksBuffer = Buffer.fromArray<Ledger.CandidBlock>(blocks);

        label gettingArchivedBlocks for({callback; start; length} in Iter.fromArray(archived_blocks)){
            switch(await callback({start; length})){
                case(#Err(_)){ continue gettingArchivedBlocks };
                case(#Ok({blocks})){ BlocksBuffer.append(Buffer.fromArray(blocks)); };
            };
        };

        label updatingTxHistory for({transaction; timestamp; parent_hash} in Iter.fromArray(blocks)){
            let {operation} = transaction;
            let ?operation_ = operation else continue updatingTxHistory;
            switch(operation_){
                case(#Transfer({to; from; amount; fee;})){
                    let timeOfCreation = transaction.created_at_time.timestamp_nanos;
                    let senderCanisterId = accountIdsToCanisterIds.get(from);
                    let recipientCanisterId = accountIdsToCanisterIds.get(to);
                    switch(senderCanisterId){
                        case null {};
                        case(?senderCanisterId_){
                            let userJournal : Journal.Journal = actor(Principal.toText(senderCanisterId_));
                            let tx : JournalTypes.Transaction = { balanceDelta = amount.e8s + fee.e8s; increase = false; recipient = to; timeStamp = timeOfCreation; source = from; };
                            ignore userJournal.updateTxHistory(timeOfCreation,tx);
                        };
                    };
                    switch(recipientCanisterId){
                        case null {};
                        case(?recipientCanisterId_){
                            let userJournal : Journal.Journal = actor(Principal.toText(recipientCanisterId_));
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
                        ignore treasuryCanister.updateTokenBalances(#Principal(metaData.treasuryCanisterPrincipal),#Icp, #MultiSigAccount);
                    };
                };
                case(_){};
            };
        };

        return {newStartIndexForNextQuery; isCaughtUp};
    };
};