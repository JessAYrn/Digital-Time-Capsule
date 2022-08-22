import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Trie "mo:base/Trie";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Principal "mo:base/Principal"; 
import Time "mo:base/Time";
import Cycles "mo:base/ExperimentalCycles";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import Ledger "/Ledger/Ledger";
import LedgerCandid "/Ledger/LedgerCandid";
import Journal "Journal/Journal";
import Account "/Ledger/Account";
import IC "/IC/ic.types";
import NFT "/NFT/Dip-721-NFT-Container";
import DIP721Types "/NFT/dip721.types";
import JournalTypes "/Journal/journal.types";
import MainMethods "/Main/MainHelperMethods";
import JournalHelperMethods "/Main/JournalHelperMethods";
import NftHelperMethods "/Main/NftHelperMethods";
import MainTypes "/Main/types";
import TxHelperMethods "/Main/TransactionHelperMethods";

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
    //Transaction Mehtods
    //_______________________________________________________________________________________________________________________________________________

    public shared(msg) func transferICP(amount: Nat64, canisterAccountId: Account.AccountIdentifier) : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await TxHelperMethods.transferICP(callerId, profiles, amount, canisterAccountId);
        return result;
    };

    public shared(msg) func readTransaction() : async Result.Result<[(Nat, JournalTypes.Transaction)], JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await TxHelperMethods.readTransaction(callerId, profiles);
        return result;
    };

    private func updateUsersTxHistory() : async () {
        let tipOfChainInfo = await TxHelperMethods.tipOfChainDetails();
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

        await TxHelperMethods.updateUsersTxHistory(queryResponse, profiles);
    };

    //NFT Methods
    //______________________________________________________________________________________________________________________________________________

    public shared(msg) func createNFTCollection(initInput : DIP721Types.Dip721NonFungibleTokenInput) : async Result.Result<Nat64, JournalTypes.Error> {
        let callerId = msg.caller;
        let mainCanisterPrincipal = Principal.fromActor(this);
        let result = await NftHelperMethods.createNFTCollection(
            callerId, 
            mainCanisterPrincipal,
            profiles,
            initInput,
            nftCollectionsIndex
        );

        switch(result){
            case(#ok(collectionAndAmountAccepted)){
                let collection = collectionAndAmountAccepted.0;
                let amountAccepted = collectionAndAmountAccepted.1;
                let (newNftTrie, oldValueForThisKey) = Trie.put(
                    nftCollections,
                    natKey(nftCollectionsIndex),
                    Nat.equal,
                    collection
                );
                nftCollections := newNftTrie;
                nftCollectionsIndex += 1;
                #ok(amountAccepted.accepted);
            };
            case(#err(e)){

                return #err(e);
            };
        };
    };

    public shared(msg) func mintNft( nftCollectionIndex: Nat, file_type: Text, numberOfCopies: Nat) : async DIP721Types.MintReceipt {
        let callerId = msg.caller;
        let result = await NftHelperMethods.mintNft(callerId, profiles, nftCollections, nftCollectionIndex, file_type, numberOfCopies);
        return result;
    };

    public shared(msg) func uploadNftChunk(nftCollectionIndex : Nat, chunkId: Nat, blobChunk: Blob) : async Result.Result<(), DIP721Types.ApiError>{
        let callerId = msg.caller;
        let result = await NftHelperMethods.uploadNftChunk(callerId, profiles, nftCollections, nftCollectionIndex, chunkId, blobChunk);
        return result;
    };

    public shared(msg) func safeTransferNFT( nftCollectionIndex: Nat, to: Principal, token_id: DIP721Types.TokenId) : async DIP721Types.TxReceipt{
        let callerId = msg.caller;
        let result = await NftHelperMethods.safeTransferNFT( callerId, profiles, nftCollections, nftCollectionIndex, to, token_id);
        return result;
    };

    public shared(msg) func getUserNFTsInfo() : async Result.Result<[({nftCollectionKey: Nat}, DIP721Types.TokenMetaData)], JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await NftHelperMethods.getUserNFTsInfo(callerId, profiles, nftCollections);
        return result;
    };

    public shared(msg) func getNftChunk( nftCollectionKey : Nat, tokenId: Nat64, chunkKey: Nat) : async DIP721Types.MetadataResult {
        let callerId = msg.caller;
        let result = await NftHelperMethods.getNftChunk(callerId, nftCollections, nftCollectionKey, tokenId, chunkKey);
        return result;
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