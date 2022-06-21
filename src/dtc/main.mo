import Ledger "/Ledger/Ledger";
import LedgerCandid "/Ledger/LedgerCandid";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Trie "mo:base/Trie";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Principal "mo:base/Principal"; 
import Time "mo:base/Time";
import Journal "Journal/Journal";
import Cycles "mo:base/ExperimentalCycles";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Account "/Ledger/Account";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import IC "/IC/ic.types";
import NFT "/NFT/Dip-721-NFT-Container";
import DIP721Types "/NFT/dip721.types";
import JournalTypes "/Journal/journal.types";
import MainMethods "/Main/MainHelperMethods";
import JournalHelperMethods "/Main/JournalHelperMethods";
import MainTypes "/Main/types";

shared (msg) actor class User() = this {

    let callerId = msg.caller;

    //Application State
    //stable makes it so that the variable persists across updates to the canister
    //var refers to the data being a variable
    //profiles is the name of the variable
    //Trie.Trie is the data type. a Trie is a key/value map where Nat is the key and Profile is the data type
    // and it has been initialized as empty. hence the Trie.empty()

    private stable var profiles : Trie.Trie<Principal, MainTypes.Profile> = Trie.empty();

    private stable var nftCollections : Trie.Trie<Nat, MainTypes.Nft> = Trie.empty();

    private stable var nftCollectionsIndex : Nat = 0;

    private stable var startIndexForBlockChainQuery : Nat64 = 3_512_868;

    private let ic : IC.Self = actor "aaaaa-aa";

    private var Gas: Nat64 = 10000;
    
    private var Fee : Nat64 = 9980000 + Gas;

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private let ledgerC : LedgerCandid.Interface = actor(LedgerCandid.CANISTER_ID);

    private var balance = Cycles.balance();

    private var oneICP : Nat64 = 100_000_000;

    private var capacity = 1000000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private let heartBeatInterval : Nat64 = 100;
    
    private stable var heartBeatCount : Nat64 = 0;

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

    private func getAdminAccountId () : async Result.Result<Account.AccountIdentifier, JournalTypes.Error> {
        let result = await MainMethods.getAdminAccountId(profiles);
        return result;
    };

    public shared(msg) func refillCanisterCycles() : async Result.Result<((Nat,[Nat64])), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await MainMethods.refillCanisterCycles(callerId, profiles);
        return result;
    };

    public func getProfilesSize () : async Nat {
        return Trie.size(profiles);
    };

    //Profile Methods
    //_______________________________________________________________________________________________________________________________________________________________________________________________

    //Result.Result returns a varient type that has attributes from success case(the first input) and from your error case (your second input). both inputs must be varient types. () is a unit type.
    public shared(msg) func create () : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await MainMethods.create(callerId, profiles);
        switch(result){
            case(#ok(r)){
                let newProfilesTree = r.0;
                let amountAccepted = r.1;
                profiles := newProfilesTree;
                return #ok(amountAccepted);
            };
            case(#err(e)){
                return #err(e);
            };
        };
    };

    //update profile
    public shared(msg) func updateProfile(profile: MainTypes.ProfileInput) : async Result.Result<(),JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await MainMethods.updateProfile(callerId, profiles, profile);
        switch(result){
            case(#ok(newTree)){
                profiles := newTree;
                #ok(());
            };
            case(#err(e)){
                #err(e);
            };
        };
    };

    //delete profile
    public shared(msg) func delete() : async Result.Result<(), JournalTypes.Error> {
        
        let callerId = msg.caller;
        let result = await MainMethods.delete(callerId, profiles);
        switch(result){
            case(#ok(newTree)){
                profiles := newTree;
                #ok(());
            };
            case(#err(e)){
                #err(e);
            };
        };
    };
    //Journal Methods
    //_______________________________________________________________________________________________________________________________________________________________________________________________

    //read Journal
    public shared(msg) func readJournal () : async Result.Result<({
            userJournalData : ([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio); email: ?Text; userName: ?Text;
        }), JournalTypes.Error> {

        let callerId = msg.caller;
        let result = await JournalHelperMethods.readJournal(callerId, profiles);
        return result; 
    };

    public shared(msg) func readWalletData() : async Result.Result<({ balance : Ledger.ICP; address: [Nat8]; } ), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.readWalletData(callerId, profiles);
        return result;
    };

    public shared(msg) func readEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<JournalTypes.JournalEntry, JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.readEntry(callerId, profiles, entryKey);
        return result;
    };

    public shared(msg) func readEntryFileChunk(fileId: Text, chunkId: Nat) : async Result.Result<(Blob),JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.readEntryFileChunk(callerId, profiles, fileId, chunkId);
        return result;
    };

    public shared(msg) func readEntryFileSize(fileId: Text) : async Result.Result<(Nat),JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.readEntryFileSize(callerId, profiles, fileId);
        return result;
    };

    public shared(msg) func updateBio(bio: JournalTypes.Bio) : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.updateBio(callerId, profiles, bio);
        return result;
    };

    public shared(msg) func updateJournalEntry(entryKey : ?JournalTypes.EntryKey, entry : ?JournalTypes.JournalEntryInput) : async Result.Result<Trie.Trie<Nat,JournalTypes.JournalEntry>, JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.updateJournalEntry(callerId, profiles, entryKey, entry);
        return result;
    };

    public shared(msg) func submitFile(localFileIndex: Nat, fileId : Text) : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.submitFile(callerId, profiles, localFileIndex, fileId);
        return result;
    };

    public shared(msg) func clearLocalFile(localFileIndex: Nat): async Result.Result<(), JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.clearLocalFile(callerId, profiles, localFileIndex);
        return result;
    };

    public shared(msg) func uploadJournalEntryFile(localFileIndex: Nat, chunkId: Nat, blobChunk: Blob): async Result.Result<(), JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.uploadJournalEntryFile(callerId, profiles, localFileIndex, chunkId, blobChunk);
        return result;
    };

    public shared(msg) func getEntriesToBeSent() : async Result.Result<[(Text,[(Nat, JournalTypes.JournalEntry)])], JournalTypes.Error>{

        let callerId = msg.caller;
        let result = await JournalHelperMethods.getEntriesToBeSent(callerId, profiles);
        return result;
    };

    //NFT Methods
    //______________________________________________________________________________________________________________________________________________

    public shared(msg) func createNFTCollection(init : DIP721Types.Dip721NonFungibleToken) : async Result.Result<Nat64, JournalTypes.Error> {

        let callerId = msg.caller;

        let result = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                #err(#NotFound);
            };
            case (? existingProfile){
                let userName = existingProfile.userName;
                switch(userName){
                    case null{
                        #err(#NotFound);
                    };
                    case(? existingUserName){
                        if(existingUserName == "admin"){
                            Cycles.add(1_000_000_000_000);
                            let newNftCollection = await NFT.Dip721NFT( Principal.fromActor(this) , init);
                            let amountAccepted = await newNftCollection.wallet_receive();

                            let collection : MainTypes.Nft = {
                                nftCollection = newNftCollection
                            };

                            let (newNftTrie, oldValueForThisKey) = Trie.put(
                                nftCollections,
                                natKey(nftCollectionsIndex),
                                Nat.equal,
                                collection
                            );

                            nftCollections := newNftTrie;
                            nftCollectionsIndex += 1;

                            #ok(amountAccepted.accepted);
                        } else {
                            #err(#NotAuthorized);
                        };
                    };
                };
            };
        };
    };

    public shared(msg) func mintNft( nftCollectionIndex: Nat, file_type: Text) : async DIP721Types.MintReceipt {
        let callerId = msg.caller;

        let userAccount = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(userAccount){
            case null{
                #Err(#Unauthorized);
            };  
            case(? exisitingAccount){
                if(Option.get(exisitingAccount.userName, "null") == "admin"){
                    let result = Trie.find(
                        nftCollections,
                        natKey(nftCollectionIndex),
                        Nat.equal
                    );

                    switch(result){
                        case null{
                            #Err(#Other);
                        };
                        case(? existingCollection){
                            let collection = existingCollection.nftCollection;
                            let receipt = await collection.mintDip721(callerId, file_type);
                            return receipt;
                        };
                    };

                } else {
                    #Err(#Unauthorized);
                }
            };
        };
    };

    public shared(msg) func uploadNftChunk(nftCollectionIndex : Nat, metadata : DIP721Types.MetadataKeyVal) : async Result.Result<(), DIP721Types.ApiError>{
        let callerId = msg.caller;

        let userAccount = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(userAccount){
            case null{
                #err(#Unauthorized);
            };  
            case(? exisitingAccount){
                if(Option.get(exisitingAccount.userName, "null") == "admin"){
                    let result = Trie.find(
                        nftCollections,
                        natKey(nftCollectionIndex),
                        Nat.equal
                    );

                    switch(result){
                        case null{
                            #err(#Other);
                        };
                        case(? existingCollection){
                            let collection = existingCollection.nftCollection;
                            let receipt = await collection.uploadNftChunk(metadata);
                            return receipt;
                        };
                    };
                } else {
                    #err(#Unauthorized);
                }
            };
        };
    };

    public shared(msg) func safeTransferNFT( nftCollectionIndex: Nat, to: Principal, token_id: DIP721Types.TokenId) : async DIP721Types.TxReceipt{
        let callerId = msg.caller;
        let userProfile = Trie.find(
            profiles,
            key(callerId),
            Principal.equal,
        );
        switch(userProfile){
            case null{
                #Err(#ZeroAddress);
            };
            case(? existingProfile){
                let recipient = Trie.find(
                    profiles,
                    key(to),
                    Principal.equal,
                );
                switch(recipient){
                    case null{
                        #Err(#ZeroAddress);
                    };
                    case (? existingRecipient){
                        let nftCollection = Trie.find(
                            nftCollections,
                            natKey(nftCollectionIndex),
                            Nat.equal
                        );
                        switch(nftCollection){
                            case null{
                                #Err(#Other);
                            }; 
                            case (? existingNftCollection){
                                let collection = existingNftCollection.nftCollection;
                                let result = await collection.safeTransferFromDip721(callerId, to, token_id);
                                return result;
                            };
                        };
                    };
                };
            };
        };
    };

    public shared(msg) func getUserNFTsInfo() : async Result.Result<[({nftCollectionKey: Nat}, DIP721Types.TokenMetaData)], JournalTypes.Error> {
        let callerId = msg.caller;

        let userProfile = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(userProfile){
            case null{
                #err(#NotFound);
            };
            case (? existingProfile){
                let nftCollectionsTrieSize = Trie.size(nftCollections);
                let nftCollectionsIter = Trie.iter(nftCollections);
                let nftCollectionsArray = Iter.toArray(nftCollectionsIter);
                let ArrayBuffer = Buffer.Buffer<({nftCollectionKey: Nat}, DIP721Types.TokenMetaData)>(1);

                var index = 0;

                while(index < nftCollectionsTrieSize){
                    let collectionAndKey = nftCollectionsArray[index];
                    let collectionKey = collectionAndKey.0;
                    let collectionObject = collectionAndKey.1;
                    let collection = collectionObject.nftCollection;
                    let tokenMetadataInfoArray = await collection.getTokenMetadataInfo(callerId);
                    let tokenIdsCount = Iter.size(Iter.fromArray(tokenMetadataInfoArray));

                    var index_1 = 0;
                    
                    while(index_1 < tokenIdsCount){

                        let tokenMetadataInfo = tokenMetadataInfoArray[index_1];
                        let tokenId = tokenMetadataInfo.id;
                        let metadataSize = tokenMetadataInfo.metaDataArraySize;
                        let fileType = tokenMetadataInfo.fileType;
                        let nftMetaData = {
                            id = tokenId;
                            metaDataArraySize = metadataSize;
                            fileType = fileType;
                        };

                        ArrayBuffer.add(({ nftCollectionKey = collectionKey; }, nftMetaData));

                        index_1 += 1;
                    };

                    index += 1;
                };

                return #ok(ArrayBuffer.toArray());
            };
        };
    };

    public shared(msg) func getNftChunk( nftCollectionKey : Nat, tokenId: Nat64, chunkKey: Nat) : async DIP721Types.MetadataResult {
        let callerId = msg.caller;
        let result = Trie.find(
            nftCollections,
            natKey(nftCollectionKey),
            Nat.equal
        );
        switch(result){
            case null{
                #Err(#Other);
            };
            case (? nftCollection){
                let collection = nftCollection.nftCollection;
                let nftChunk = await collection.getMetadataDip721Chunk(callerId, chunkKey, tokenId);
                return nftChunk;
            };
        };
    };

    func myAccountId() : Account.AccountIdentifier {
        Account.accountIdentifier(callerId, Account.defaultSubaccount())
    };

    public query func canisterAccount() : async Account.AccountIdentifier {
        myAccountId()
    };

    public func mainCanisterCyclesBalance() : async Nat {
        return Cycles.balance();
    };

    public func canisterBalance() : async Ledger.ICP {
        await ledger.account_balance({ account = myAccountId() })
    };

    public shared(msg) func transferICP(amount: Nat64, canisterAccountId: Account.AccountIdentifier) : async Result.Result<(), JournalTypes.Error> {

        let callerId = msg.caller;
        let amountMinusFeeAndGas = amount - Fee - Gas;
        let feeMinusGas = Fee - Gas;

        if(amount <= Fee){
            return #err(#TxFailed);
        } else {

            let userProfile = Trie.find(
                profiles,
                key(callerId), //Key
                Principal.equal 
            );

            switch(userProfile) {
                case null{
                    #err(#NotFound)
                }; 
                case (? profile){
                    let userJournal = profile.journal;
                    let userBalance = await userJournal.canisterBalance();
                
                    if(userBalance.e8s >= amount){
                        let adminCanisterAccountIdVarient = await getAdminAccountId();
                        let adminCanisterAccountId = Result.toOption(adminCanisterAccountIdVarient);
                        switch(adminCanisterAccountId){
                            case (? adminAccountId){
                                let userName = Option.get(profile.userName, "noName");
                                if (userName == "admin"){
                                    let statusForIcpTransfer = await userJournal.transferICP(amount, canisterAccountId);
                                    #ok(());
                                } else {
                                    let statusForFeeCollection = await userJournal.transferICP(feeMinusGas, adminAccountId);
                                    let statusForIcpTransfer = await userJournal.transferICP(amountMinusFeeAndGas, canisterAccountId);
                                    if(statusForFeeCollection == true){
                                        if(statusForIcpTransfer == true){
                                            #ok(());
                                        } else {
                                            #err(#TxFailed);
                                        }
                                    } else {
                                        #err(#TxFailed);
                                    }
                                }
                            };
                            case null {
                                #err(#NotAuthorized);
                            };
                        };
                    } else {
                        #err(#InsufficientFunds)
                    }
                    

                };
            };
        }
    };

    public shared(msg) func readTransaction() : async Result.Result<[(Nat, JournalTypes.Transaction)], JournalTypes.Error> {
        let callerId = msg.caller;
        
        let callerProfile = Trie.find(
            profiles,
            key(callerId), //Key
            Principal.equal 
        );

        switch(callerProfile){
            case null{
                #err(#NotFound);
            }; 
            case ( ? profile){
                let userJournal = profile.journal;
                let tx = await userJournal.readWalletTxHistory();
                return #ok(tx);
            };
        };

    };

    private func updateUsersTxHistory() : async () {
        let tipOfChainInfo = await tipOfChainDetails();
        let tipOfChainIndex : Nat64 = tipOfChainInfo.0;
        let startIndex : Nat64 = startIndexForBlockChainQuery;
        let maxQueryLength : Nat64 = 2_000;
        let newStartIndexForNextQuery = Nat64.min(tipOfChainIndex, startIndex + maxQueryLength);

        startIndexForBlockChainQuery := newStartIndexForNextQuery;

        let getBlocksArgs = {
            start = startIndex;
            length = maxQueryLength;
        };

        let queryResponse = await ledger.query_blocks(getBlocksArgs);
        let blocksArray = queryResponse.blocks;
        let blocksArraySize = Iter.size(Iter.fromArray(blocksArray));

        var index = 0;

        while(index < blocksArraySize){

            let block = blocksArray[index];
            let transaction = block.transaction;
            let operation = transaction.operation;

            switch(operation){
                case null {

                };
                case(? existingOperation){
                    switch(existingOperation){
                        case(#Transfer(r)){
                            let recipient = r.to;
                            let source = r.from;
                            let amount = r.amount.e8s;
                            let fee = r.fee.e8s;
                            let timeOfCreation = transaction.created_at_time.timestamp_nanos;

                            let profilesSize = Trie.size(profiles);
                            let profilesIter = Trie.iter(profiles);
                            let profilesArray = Iter.toArray(profilesIter);

                            var index_1 = 0;

                            while(index_1 < profilesSize){
                                let userProfileAndPrincipal = profilesArray[index_1];
                                let userProfile = userProfileAndPrincipal.1;
                                let userAccountId = userProfile.accountId;
                                switch(userAccountId){
                                    case null{

                                    };
                                    case(? existingUAID){
                                        if(Blob.equal(existingUAID, recipient) == true){                                    
                                            let tx : JournalTypes.Transaction = {
                                                balanceDelta = amount + fee;
                                                increase = true;
                                                recipient = ?recipient;
                                                timeStamp = ?timeOfCreation;
                                                source = ?source;
                                            };
                                            let userJournal = userProfile.journal;
                                            await userJournal.updateTxHistory(tx);
                                        } else {
                                            if(Blob.equal(existingUAID, source)){
                                                let tx : JournalTypes.Transaction = {
                                                    balanceDelta = amount + fee;
                                                    increase = false;
                                                    recipient = ?recipient;
                                                    timeStamp = ?timeOfCreation;
                                                    source = ?source;
                                                };
                                                let userJournal = userProfile.journal;
                                                await userJournal.updateTxHistory(tx);
                                            }
                                        }
                                    };
                                };
                                index_1 += 1;
                            };

                        };
                        case(#Burn(r)){

                        };
                        case(#Mint(r)){

                        };
                    };
                };
            };
            index += 1;
        };
    };

    public shared func tipOfChainDetails() : async (Ledger.BlockIndex, LedgerCandid.Transaction) {
        let tip = await ledgerC.tip_of_chain();
        switch (tip) {
            case (#Err(_)) {
                assert(false);
                loop {};
            };
            case (#Ok(t)) {
                let block = await ledgerC.block(t.tip_index);
                switch (block) {
                    case (#Err(_)) {
                        assert(false);
                        loop {};
                    };
                    case (#Ok(r)) {
                        switch (r) {
                            case (#Err(_)) {
                                assert(false);
                                loop {};
                            };
                            case (#Ok(b)) {
                                (t.tip_index, b.transaction);
                            };
                        };
                    };
                };
            };
        };
    };

    public shared(msg) func getPrincipalsList() : async [Principal] {
        let callerId = msg.caller;

        let profile = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(profile){
            case null{
                throw Error.reject("Unauthorized access. Caller is not an admin.");
            };
            case ( ? existingProfile){

                if (Option.get(existingProfile.userName, "null") == "admin") {

                    var index = 0;
                    let numberOfProfiles = Trie.size(profiles);
                    let profilesIter = Trie.iter(profiles);
                    let profilesArray = Iter.toArray(profilesIter);
                    let ArrayBuffer = Buffer.Buffer<(Principal)>(1);

                    while(index < numberOfProfiles){
                        let userProfile = profilesArray[index];
                        let userPrincipal = userProfile.0;
                        ArrayBuffer.add(userPrincipal);
                        index += 1;
                    };

                    return ArrayBuffer.toArray();

                } else {
                    throw Error.reject("Unauthorized access. Caller is not an admin.");

                }

            };
        };

    };

    public shared(msg) func installCode( userPrincipal: Principal, args: Blob, wasmModule: Blob): async() {
        let callerId = msg.caller;

        let profile = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(profile){
            case null{
                throw Error.reject("Unauthorized access. Caller is not an admin.");
            };
            case ( ? existingProfile){

                if (Option.get(existingProfile.userName, "null") == "admin") {

                    let theUserProfile = Trie.find(
                        profiles,
                        key(userPrincipal),
                        Principal.equal
                    );

                    switch(theUserProfile){
                        case null{
                            throw Error.reject("No profile for this principal.");
                        };
                        case ( ? existingProfile){
                            let userJournal = existingProfile.journal;
                            let journalCanisterId = Principal.fromActor(userJournal);
                            await ic.stop_canister({canister_id = journalCanisterId});
                            await ic.install_code({
                                arg = args;
                                wasm_module = wasmModule;
                                mode = #upgrade;
                                canister_id = journalCanisterId;
                            });
                            await ic.start_canister({canister_id = journalCanisterId});

                        };
                    };

                } else {
                    throw Error.reject("Unauthorized access. Caller is not an admin.");

                }

            };

        };
    };

    system func heartbeat() : async () {

        heartBeatCount += 1;

        if(heartBeatCount % heartBeatInterval == 0){
            await updateUsersTxHistory();
        };
    };

    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };
}