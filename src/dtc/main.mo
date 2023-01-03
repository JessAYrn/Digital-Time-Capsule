import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
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
import Ledger "Ledger/Ledger";
import LedgerCandid "Ledger/LedgerCandid";
import Journal "Journal/Journal";
import Account "Ledger/Account";
import NFT "NFT/Dip-721-NFT-Container";
import DIP721Types "NFT/dip721.types";
import JournalTypes "Journal/journal.types";
import MainMethods "Main/MainHelperMethods";
import JournalHelperMethods "Main/JournalHelperMethods";
import NftHelperMethods "Main/NftHelperMethods";
import MainTypes "Main/types";
import TxHelperMethods "Main/TransactionHelperMethods";
import CanisterManagementMethods "Main/CanisterManagementMethods";
import NftCollection "NftCollection/NftCollection";
import Support "SupportCanisterIds/SupportCanisterIds";
import IC "IC/ic.types";
import Hex "Ledger/Hex";

shared (msg) actor class User() = this {

    let callerId = msg.caller;

    //Application State
    //stable makes it so that the variable persists across updates to the canister
    //var refers to the data being a variable
    //profiles is the name of the variable
    //Trie.Trie is the data type. a Trie is a key/value map where Nat is the key and Profile is the data type
    // and it has been initialized as empty. hence the Trie.empty()

    private var isLocal : Bool = false;

    private let ic : IC.Self = actor "aaaaa-aa";

    private stable var profiles : Trie.Trie<Principal, MainTypes.Profile> = Trie.empty();

    private stable var nftCollections : Trie.Trie<Nat, MainTypes.Nft> = Trie.empty();

    private stable var nftCollectionsIndex : Nat = 0;

    private stable var supportMode : Bool = false;

    private stable var defaultControllers : [Principal] = [];

    private stable var canisterData : MainTypes.CanisterData = {
        frontEndPrincipal = "Null";
        backEndPrincipal = "Null";
        lastRecordedBackEndCyclesBalance = 0;
        backEndCyclesBurnRatePerDay = 0;
        nftOwner = "Null";
        nftId = -1;
        acceptingRequests = true;
        lastRecordedTime = 0;
        users = Trie.empty();
    };

    private stable var requestsForApproval: [Text] = [];

    private stable var startIndexForBlockChainQuery : Nat64 = 3_512_868;

    private var Gas: Nat64 = 10000;
    
    private var Fee : Nat64 = 9980000 + Gas;

    private let ledger  : Ledger.Interface  = actor(Ledger.CANISTER_ID);

    private let ledgerC : LedgerCandid.Interface = actor(LedgerCandid.CANISTER_ID);

    private let nftCollection : NftCollection.Interface = actor(NftCollection.CANISTER_ID);

    private var balance = Cycles.balance();

    private var oneICP : Nat64 = 100_000_000;

    private var capacity = 1000000000000000;

    private var nanosecondsInADay = 86400000000000;

    private var daysInAMonth = 30;

    private let heartBeatInterval : Nat64 = 100;

    private let heartBeatInterval_refill : Nat64 = 25000;
    
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

    //Profile Methods
    //_______________________________________________________________________________________________________________________________________________________________________________________________

    //Result.Result returns a varient type that has attributes from success case(the first input) and from your error case (your second input). both inputs must be varient types. () is a unit type.
    public shared(msg) func create () : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await MainMethods.create(callerId, canisterData, profiles, isLocal);
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

    public shared(msg) func updateBio(bio: JournalTypes.Bio) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.updateBio(callerId, profiles, bio);
        return result;
    };

    public shared(msg) func updatePhotos(photos: [JournalTypes.FileMetaData]) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.updatePhotos(callerId, profiles, photos);
        return result;
    };

    public shared(msg) func updateJournalEntry(entryKey : ?JournalTypes.EntryKey, entry : ?JournalTypes.JournalEntryInput) : 
    async Result.Result<([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.updateJournalEntry(callerId, profiles, entryKey, entry);
        return result;
    };

    public shared(msg) func deleteUnsubmittedFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.deleteUnsubmittedFile(callerId, profiles, fileId);
        return result;
    };

    public shared(msg) func deleteSubmittedFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.deleteSubmittedFile(callerId, profiles, fileId);
        return result;
    };

    public shared(msg) func submitFiles() : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.submitFiles(callerId, profiles);
        return result;
    };

    public shared(msg) func clearUnsubmittedFiles(): async Result.Result<(), JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.clearUnsubmittedFiles(callerId, profiles);
        return result;
    };

    public shared(msg) func uploadJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk: Blob): async Result.Result<(Text), JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.uploadJournalEntryFile(callerId, profiles, fileId, chunkId, blobChunk);
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
        let result = await CanisterManagementMethods.getPrincipalsList(callerId, profiles, canisterData);
        return result;
    };

    public shared(msg) func addApprovedUser(principal : Text) : async Result.Result<(MainTypes.UsersExport), JournalTypes.Error> {
        let callerId = msg.caller;
        let principalAsBlob = Principal.fromText(principal);
        let updatedCanisterData = await CanisterManagementMethods.addApprovedUser(callerId, principalAsBlob, canisterData);
        switch(updatedCanisterData){
            case(#ok(data)){
                canisterData := data;
                let users = Trie.iter(canisterData.users);
                let usersExport = Iter.toArray(users);
                return #ok(usersExport)
            };
            case(#err(e)){
                return #err(e);
            };
        };
    };

    public shared(msg) func removeApprovedUser(principal: Text) : async Result.Result<(MainTypes.UsersExport), JournalTypes.Error> {
        let callerId = msg.caller;
        let principalAsBlob = Principal.fromText(principal);
        let updatedCanisterData = await CanisterManagementMethods.removeApprovedUser(callerId, principalAsBlob, canisterData);
        switch(updatedCanisterData){
            case(#ok(data)){
                canisterData := data;
                let users = Trie.iter(canisterData.users);
                let usersExport = Iter.toArray(users);
                return #ok(usersExport);
            }; 
            case(#err(e)){
                return #err(e)
            };
        };
    };

    public shared(msg) func configureApp(frontEndPrincipal : Text, nftId: Int ) : async Result.Result<(), JournalTypes.Error> {
        let backEndPrincipalAsPrincipal = Principal.fromActor(this);
        let backEndPrincipal = Principal.toText(backEndPrincipalAsPrincipal);
        //let upgradeCanisterPrincipal = Principal.fromActor(upgradeCanisterActor);
        // pass that into the configureApp function
        let result = await CanisterManagementMethods.configureApp( backEndPrincipal, frontEndPrincipal, nftId, canisterData);
        let updatedCanisterData = result.0;
        let defaultControllers_ = result.1;
        if(canisterData.frontEndPrincipal == "Null" or canisterData.nftId == -1){
            canisterData := updatedCanisterData;
            defaultControllers := defaultControllers_;
            #ok(());
        } else {
            return #err(#NotAuthorized);
        };
        
    };

    public shared(msg) func toggleAcceptRequest() : async  Result.Result<(MainTypes.CanisterData), JournalTypes.Error>{
        let callerId = msg.caller;
        let result = CanisterManagementMethods.toggleAcceptRequest(callerId, canisterData);
        switch(result){
            case(#err(e)){
                return #err(e);
            };
            case(#ok(updatedCanisterData)){
                canisterData := updatedCanisterData;
                return #ok(updatedCanisterData);
            }
        };
    };

    public shared(msg) func getRequestingPrincipals() : async Result.Result<([Text]), JournalTypes.Error>{
        let callerId = msg.caller;
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            return #err(#NotAuthorized);
        } else {
            return #ok(requestsForApproval)
        };
    };

    public shared(msg) func requestApproval() : async Result.Result<([Text]), JournalTypes.Error>{
        let callerId = msg.caller;
        if(canisterData.acceptingRequests == false){
            return #err(#NotAcceptingRequests);
        };
        let callerIdAsText = Principal.toText(callerId);
        let ArrayBuffer = Buffer.Buffer<Text>(1);
        var inListAlready = false;
        let requestsForApprovalIter = Iter.fromArray(requestsForApproval);
        Iter.iterate<Text>(requestsForApprovalIter, func (x : Text, index: Nat){
            if(x == callerIdAsText){
                inListAlready := true
            };
            ArrayBuffer.add(x);
        });

        if(inListAlready == false){
            ArrayBuffer.add(callerIdAsText);
        };
        requestsForApproval := ArrayBuffer.toArray();
        return #ok(requestsForApproval);
    };

    public shared(msg) func removePrincipalFromRequestsArray(principalOfRequester: Text) : 
    async Result.Result<([Text]), JournalTypes.Error>{
        let callerId = msg.caller;
        let callerIdAsText = Principal.toText(callerId);
        if( callerIdAsText != canisterData.nftOwner ){
            return #err(#NotAuthorized);
        };
        let ArrayBuffer = Buffer.Buffer<Text>(1);
        let requestsForApprovalIter = Iter.fromArray(requestsForApproval);
        Iter.iterate<Text>(requestsForApprovalIter, func (x: Text, index: Nat){
            if(x != principalOfRequester){
                ArrayBuffer.add(x);
            }
        });
        requestsForApproval := ArrayBuffer.toArray();
        return #ok(requestsForApproval);
    };

    public shared(msg) func getCanisterCyclesBalances() : async MainTypes.CanisterCyclesBalances{
        let cyclesBalance_backend = Cycles.balance();
        let balances = await CanisterManagementMethods.getCanisterCyclesBalances(cyclesBalance_backend, canisterData);
        return balances;
    };

    public shared(msg) func getCanisterData() : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {
        let callerId = msg.caller;
        let cyclesBalance_backend = Cycles.balance();
        let canisterDataPackagedForExport = await CanisterManagementMethods.getCanisterData(callerId, canisterData, cyclesBalance_backend, supportMode, profiles);
        return canisterDataPackagedForExport;
    };

    private func setCyclesBurnRate() : (){
        let currentCylcesBalance : Nat = Cycles.balance();
        let updatedCanisterData = CanisterManagementMethods.setCyclesBurnRate(currentCylcesBalance, canisterData);
        canisterData := updatedCanisterData;
    };

    private func setLastRecordedBackEndCyclesBalance() : (){
        let currentCylcesBalance = Cycles.balance();
        let currentTime = Time.now();
        let updatedCanisterData = CanisterManagementMethods.setLastRecordedBackEndCyclesBalance(currentCylcesBalance, currentTime, canisterData);
        canisterData := updatedCanisterData;
    };

    public shared(msg) func installCode( userPrincipal: Principal, args: Blob, wasmModule: Blob): async() {
        let callerId = msg.caller;
        let result = await CanisterManagementMethods.installCode(callerId, userPrincipal, args, wasmModule, profiles, canisterData);
    };
    
    private func verifyOwnership( principal: Principal ): async Bool {
        let accountIdBlob = Account.accountIdentifier(principal, Account.defaultSubaccount());
        let accountIdArray = Blob.toArray(accountIdBlob);
        let accountIdText = Hex.encode(accountIdArray);
        let tokens_ext_result = await nftCollection.tokens_ext(accountIdText);
        switch(tokens_ext_result){
            case(#ok(tokensOwned)){
                var index = 0;
                let tokensOwnedIter = Iter.fromArray(tokensOwned);
                let numberOfTokensOwned = Iter.size(tokensOwnedIter);
                while(index < numberOfTokensOwned){
                    let tokenData = tokensOwned[index];
                    let tokenIndex = tokenData.0;
                    var tokenIndexAsNat = Nat32.toNat(tokenIndex);
                    tokenIndexAsNat := tokenIndexAsNat + 1;
                    if(tokenIndexAsNat == canisterData.nftId){
                        return true;
                    };
                    index += 1;
                };
                return false;
            };
            case(#err(e)){
                return false;
            };
        };
            
    };

    private func setToDefualtControllerSettings(canisterPrincipal: Principal) : 
    async () {
        let canisterStatus = await ic.canister_status({canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let updatedSettings : IC.canister_settings = {
            controllers = ?defaultControllers;
            freezing_threshold = ?settings.freezing_threshold;
            memory_allocation = ?settings.memory_allocation;
            compute_allocation = ?settings.compute_allocation;
        };
        let result = await ic.update_settings({
            canister_id = canisterPrincipal;
            settings = updatedSettings;
        });
    };

    private func addController(principal: Text, canisterPrincipal: Principal) : 
    async () {
        
        let canisterStatus = await ic.canister_status({canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let controllersOption = settings.controllers;
        var controllers = Option.get(controllersOption, defaultControllers);
        let principalAsBlob = Principal.fromText(principal);
        let ArrayBuffer = Buffer.Buffer<(Principal)>(1);
        let controllersIter = Iter.fromArray(controllers);
        ArrayBuffer.add(principalAsBlob);
        Iter.iterate<Principal>(controllersIter, func (x: Principal, index: Nat){
            ArrayBuffer.add(x);
        });
        controllers := ArrayBuffer.toArray();
        let updatedSettings : IC.canister_settings = {
            controllers = ?controllers;
            freezing_threshold = ?settings.freezing_threshold;
            memory_allocation = ?settings.memory_allocation;
            compute_allocation = ?settings.compute_allocation;
        };
        let result = await ic.update_settings({
            canister_id = canisterPrincipal;
            settings = updatedSettings;
        });
    };

    public func getCanisterCongtrollers(canisterPrincipal: Principal) : async ([Text]) {
        let canisterStatus = await ic.canister_status({ canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let controllersOption = settings.controllers;
        var controllers = Option.get(controllersOption, [canisterPrincipal]);
        let ArrayBuffer = Buffer.Buffer<(Text)>(1);
        let controllersIter = Iter.fromArray(controllers);
        Iter.iterate<Principal>(controllersIter, func (x: Principal, index: Nat){
            let text = Principal.toText(x);
            ArrayBuffer.add(text);
        });
        let controllersAsTextArray = ArrayBuffer.toArray();
        return controllersAsTextArray;
    };

    public shared(msg) func toggleSupportMode() : async Result.Result<(),JournalTypes.Error>{
        let callerId = msg.caller;
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            return #err(#NotAuthorized)
        } else {
            if(supportMode == false){
                let result1 = await addController(Support.TechSupportPrincipal1, Principal.fromActor(this));
                let result2 = await addController(Support.TechSupportPrincipal2, Principal.fromActor(this));
                // will have to call addController again on Upgrader canister and front end canister
            } else {
                let result = await setToDefualtControllerSettings(Principal.fromActor(this));
                // will have to call setDefualtControllerSettings again on Upgrader canister and front end canister
            };
            supportMode := not supportMode;
            return #ok()

        };
    };

    public shared(msg) func registerOwner() : async  Result.Result<(), JournalTypes.Error>{
        let callerId = msg.caller;
        var shouldAdd = false;
        if(isLocal == true){
            shouldAdd := true;
        } else {
            shouldAdd := await verifyOwnership(callerId);
        };
        if(shouldAdd == true){
            let canisterData_withOwner = CanisterManagementMethods.updateOwner(callerId, canisterData);
            let updatedCanisterData = await CanisterManagementMethods.addApprovedUser(callerId, callerId, canisterData_withOwner);
            switch(updatedCanisterData){
                case(#ok(data)){
                    canisterData := data;
                    #ok(());
                };
                case(#err(e)){
                    return #err(e)
                };
            };
        } else {
            return #err(#NotAuthorized);
        };
    };

    system func heartbeat() : async () {

        heartBeatCount += 1;
        if(Time.now() - canisterData.lastRecordedTime > nanosecondsInADay){
            setCyclesBurnRate();
            setLastRecordedBackEndCyclesBalance();
        };

        if(heartBeatCount % heartBeatInterval == 0){
            await updateUsersTxHistory();
        };
        if(heartBeatCount % heartBeatInterval_refill == 0){
            let result = await refillCanisterCycles();
        }
    };

    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };

    private func textKey(x: Text) : Trie.Key<Text> {
        return {key = x; hash = Text.hash(x)}
    };
}