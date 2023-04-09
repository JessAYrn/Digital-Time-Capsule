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
import ManagerCanister "Manager/Manager";
import ManagerTypes "Manager/WasmStore";
import Manager "Manager/Manager";
import AssetCanister "AssetCanister/AssetCanister";

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

    private stable var profilesArray : [(Principal, MainTypes.Profile)] = [];

    private var profilesMap : MainTypes.ProfilesMap = HashMap.fromIter<Principal, MainTypes.Profile>(
        Iter.fromArray(profilesArray), 
        Iter.size(Iter.fromArray(profilesArray)), 
        Principal.equal,
        Principal.hash
    );

    private stable var nftCollections : Trie.Trie<Nat, MainTypes.Nft> = Trie.empty();

    private stable var nftCollectionsIndex : Nat = 0;

    private stable var supportMode : Bool = false;

    private stable var defaultControllers : [Principal] = [];

    private stable var canisterData : MainTypes.CanisterData = {
        managerCanisterPrincipal = "Null";
        frontEndPrincipal = "Null";
        backEndPrincipal = "Null";
        lastRecordedBackEndCyclesBalance = 0;
        backEndCyclesBurnRatePerDay = 0;
        nftOwner = "Null";
        nftId = -1;
        acceptingRequests = true;
        lastRecordedTime = 0;
    };

    private stable var requestsForAccess: MainTypes.RequestsForAccess = [];

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

    private func refillCanisterCycles() : async () {
        let result = await MainMethods.refillCanisterCycles(profilesMap);
    };

    public shared(msg) func whoAmI () : async Text{
        let callerId = msg.caller;
        return Principal.toText(callerId);
    };

    //Profile Methods
    //_______________________________________________________________________________________________________________________________________________________________________________________________

    //Result.Result returns a varient type that has attributes from success case(the first input) and from your error case (your second input). both inputs must be varient types. () is a unit type.
    public shared(msg) func create () : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {
        let callerId = msg.caller;
        let amountAccepted = await MainMethods.create(callerId, requestsForAccess, profilesMap, isLocal, defaultControllers, canisterData);
        let updatedRequestsList = await CanisterManagementMethods.removeFromRequestsList(callerId, requestsForAccess);
        switch(amountAccepted){
            case(#ok(amount)){
                requestsForAccess := updatedRequestsList;
                return #ok(amount);
            };
            case(#err(e)){
                return #err(e);
            };
        };
    };

    //update profile
    public shared(msg) func updateProfile(profile: MainTypes.ProfileInput) : async Result.Result<(),JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await MainMethods.updateProfile(callerId, profilesMap, profile);
        switch(result){
            case(#ok(_)){
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
        let result = await MainMethods.delete(callerId, profilesMap);
        switch(result){
            case(#ok(_)){
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
            userJournalData : ([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio,); 
            email: ?Text; 
            userName: ?Text;
            principal: Text;
        }), JournalTypes.Error> {

        let callerId = msg.caller;
        let result = await JournalHelperMethods.readJournal(callerId, profilesMap);
        return result; 
    };

    public shared(msg) func readWalletData() : async Result.Result<({ balance : Ledger.ICP; address: [Nat8]; } ), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.readWalletData(callerId, profilesMap);
        return result;
    };

    public shared(msg) func readEntry(entryKey: JournalTypes.EntryKey) : async Result.Result<JournalTypes.JournalEntry, JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.readEntry(callerId, profilesMap, entryKey);
        return result;
    };

    public shared(msg) func readEntryFileChunk(fileId: Text, chunkId: Nat) : async Result.Result<(Blob),JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.readEntryFileChunk(callerId, profilesMap, fileId, chunkId);
        return result;
    };

    public shared(msg) func readEntryFileSize(fileId: Text) : async Result.Result<(Nat),JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.readEntryFileSize(callerId, profilesMap, fileId);
        return result;
    };

    public shared(msg) func updateBio(bio: JournalTypes.Bio) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.updateBio(callerId, profilesMap, bio);
        return result;
    };

    public shared(msg) func updatePhotos(photos: [JournalTypes.FileMetaData]) : async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.updatePhotos(callerId, profilesMap, photos);
        return result;
    };

    public shared(msg) func updateJournalEntry(entryKey : ?JournalTypes.EntryKey, entry : ?JournalTypes.JournalEntryInput) : 
    async Result.Result<([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.updateJournalEntry(callerId, profilesMap, entryKey, entry);
        return result;
    };

    public shared(msg) func deleteUnsubmittedFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.deleteUnsubmittedFile(callerId, profilesMap, fileId);
        return result;
    };

    public shared(msg) func deleteSubmittedFile(fileId: Text) : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.deleteSubmittedFile(callerId, profilesMap, fileId);
        return result;
    };

    public shared(msg) func submitFiles() : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await JournalHelperMethods.submitFiles(callerId, profilesMap);
        return result;
    };

    public shared(msg) func clearUnsubmittedFiles(): async Result.Result<(), JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.clearUnsubmittedFiles(callerId, profilesMap);
        return result;
    };

    public shared(msg) func uploadJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk: Blob): async Result.Result<(Text), JournalTypes.Error>{
        let callerId = msg.caller;
        let result = await JournalHelperMethods.uploadJournalEntryFile(callerId, profilesMap, fileId, chunkId, blobChunk);
        return result;
    };

    public shared(msg) func getEntriesToBeSent() : async Result.Result<[(Text,[(Nat, JournalTypes.JournalEntry)])], JournalTypes.Error>{

        let callerId = msg.caller;
        let result = await JournalHelperMethods.getEntriesToBeSent(callerId, profilesMap);
        return result;
    };
    //Transaction Mehtods
    //_______________________________________________________________________________________________________________________________________________

    public shared(msg) func transferICP(amount: Nat64, canisterAccountId: Account.AccountIdentifier) : async Result.Result<(), JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await TxHelperMethods.transferICP(callerId, profilesMap, amount, canisterAccountId);
        return result;
    };

    public shared(msg) func readTransaction() : async Result.Result<[(Nat, JournalTypes.Transaction)], JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await TxHelperMethods.readTransaction(callerId, profilesMap);
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

        await TxHelperMethods.updateUsersTxHistory(queryResponse, profilesMap);
    };

    //NFT Methods
    //______________________________________________________________________________________________________________________________________________

    public shared(msg) func createNFTCollection(initInput : DIP721Types.Dip721NonFungibleTokenInput) : async Result.Result<Nat64, JournalTypes.Error> {
        let callerId = msg.caller;
        let mainCanisterPrincipal = Principal.fromActor(this);
        let result = await NftHelperMethods.createNFTCollection(
            callerId, 
            mainCanisterPrincipal,
            profilesMap,
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
        let result = await NftHelperMethods.mintNft(callerId, profilesMap, nftCollections, nftCollectionIndex, file_type, numberOfCopies);
        return result;
    };

    public shared(msg) func uploadNftChunk(nftCollectionIndex : Nat, chunkId: Nat, blobChunk: Blob) : async Result.Result<(), DIP721Types.ApiError>{
        let callerId = msg.caller;
        let result = await NftHelperMethods.uploadNftChunk(callerId, profilesMap, nftCollections, nftCollectionIndex, chunkId, blobChunk);
        return result;
    };

    public shared(msg) func safeTransferNFT( nftCollectionIndex: Nat, to: Principal, token_id: DIP721Types.TokenId) : async DIP721Types.TxReceipt{
        let callerId = msg.caller;
        let result = await NftHelperMethods.safeTransferNFT( callerId, profilesMap, nftCollections, nftCollectionIndex, to, token_id);
        return result;
    };

    public shared(msg) func getUserNFTsInfo() : async Result.Result<[({nftCollectionKey: Nat}, DIP721Types.TokenMetaData)], JournalTypes.Error> {
        let callerId = msg.caller;
        let result = await NftHelperMethods.getUserNFTsInfo(callerId, profilesMap, nftCollections);
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
        let result = await CanisterManagementMethods.getPrincipalsList(callerId, profilesMap, canisterData);
        return result;
    };

    public shared(msg) func grantAccess(principal : Text) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let callerId = msg.caller;
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            return #err(#NotAuthorized);
        };
        let principalAsBlob = Principal.fromText(principal);
        let updatedCanisterData = await CanisterManagementMethods.grantAccess(principalAsBlob, requestsForAccess);
        switch(updatedCanisterData){
            case(#ok(data)){
                requestsForAccess := data;
                return #ok(data)
            };
            case(#err(e)){
                return #err(e);
            };
        };
    };

    public shared(msg) func updateApprovalStatus(principal: Text, newApprovalStatus: Bool) : 
    async Result.Result<(MainTypes.ProfilesApprovalStatuses), JournalTypes.Error>{
        let callerId = msg.caller;
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            return #err(#NotAuthorized);
        };
        let result = await CanisterManagementMethods.updateApprovalStatus(Principal.fromText(principal), profilesMap, newApprovalStatus);
        switch(result){
            case(#ok(_)){
                let profilesApprovalStatuses = CanisterManagementMethods.getProfilesMetaData(profilesMap);
                return #ok(profilesApprovalStatuses);
            };
            case(#err(e)){
                return #err(e);
            }
        };
    };

    public shared(msg) func removeFromRequestsList(principal: Text) : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {
        let callerId = msg.caller;
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            return #err(#NotAuthorized);
        };
        let principalAsBlob = Principal.fromText(principal);
        let updatedRequestsList = await CanisterManagementMethods.removeFromRequestsList(principalAsBlob, requestsForAccess);
        requestsForAccess := updatedRequestsList;
        return #ok(updatedRequestsList);
    };

    public shared(msg) func configureApp(frontEndPrincipal : Text, nftId: Int ) : async Result.Result<(), JournalTypes.Error> {
        if(canisterData.frontEndPrincipal == "Null" or canisterData.nftId == -1 or canisterData.managerCanisterPrincipal == "Null"){
            let backEndPrincipalAsPrincipal = Principal.fromActor(this);
            let backEndPrincipal = Principal.toText(backEndPrincipalAsPrincipal);
            let result = await CanisterManagementMethods.configureApp( backEndPrincipal, frontEndPrincipal, nftId, canisterData);
            let updatedCanisterData = result.0;
            let defaultControllers_ = result.1;
            canisterData := updatedCanisterData;
            defaultControllers := defaultControllers_;
            #ok(());
        } else {
            return #err(#NotAuthorized);
        };
    };

    public shared(msg) func authorizePrinicpalToViewAssets(prinicpal: Principal): async () {
        assert(Principal.toText(msg.caller) == canisterData.nftOwner);
        let frontEndPrincipal = Principal.fromText(canisterData.frontEndPrincipal);
        let result = await CanisterManagementMethods.authorizePrinicpalToViewAssets(prinicpal, frontEndPrincipal);
    };

    public shared(msg) func getAssetCanisterAuthorizedPrincipals() : async [Principal] {
        let assetCanister: AssetCanister.Interface = actor(canisterData.frontEndPrincipal);
        let result = await assetCanister.list_authorized();
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

    public shared(msg) func getRequestingPrincipals() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        let callerId = msg.caller;
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            return #err(#NotAuthorized);
        } else {
            return #ok(requestsForAccess)
        };
    };

    public shared(msg) func requestApproval() : async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error>{
        let callerId = msg.caller;
        if(canisterData.acceptingRequests == false){
            return #err(#NotAcceptingRequests);
        };
        let callerIdAsText = Principal.toText(callerId);
        let ArrayBuffer = Buffer.Buffer<(Text, MainTypes.Approved)>(1);
        var inListAlready = false;
        let requestsForAccessIter = Iter.fromArray(requestsForAccess);
        Iter.iterate<(Text, MainTypes.Approved)>(requestsForAccessIter, func (x : (Text, MainTypes.Approved), index: Nat){
            let (principalAsText, approved) = x;
            if(principalAsText == callerIdAsText){
                inListAlready := true
            };
            ArrayBuffer.add((principalAsText, approved));
        });

        if(inListAlready == false){
            ArrayBuffer.add((callerIdAsText, false));
        };
        requestsForAccess := ArrayBuffer.toArray();
        return #ok(requestsForAccess);
    };

    public shared(msg) func getCanisterCyclesBalances() : async MainTypes.CanisterCyclesBalances{
        let cyclesBalance_backend = Cycles.balance();
        let balances = await CanisterManagementMethods.getCanisterCyclesBalances(cyclesBalance_backend, canisterData);
        return balances;
    };

    public shared(msg) func getCanisterData() : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {
        let callerId = msg.caller;
        let cyclesBalance_backend = Cycles.balance();
        let canisterDataPackagedForExport = await CanisterManagementMethods.getCanisterData(callerId, canisterData, cyclesBalance_backend, supportMode, profilesMap);
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

    public shared(msg) func installCode(wasmModule: Blob): async() {
        let callerId = msg.caller;
        let result = await CanisterManagementMethods.installCode_journalCanisters(callerId,wasmModule, profilesMap, canisterData);
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

    public func getCanisterCongtrollers(canisterPrincipal: Principal) : async ([Text]) {
        let canisterStatus = await ic.canister_status({ canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let controllersOption = settings.controllers;
        var controllers = Option.get(controllersOption, defaultControllers);
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
                let result1 = await CanisterManagementMethods.addController(
                    Support.TechSupportPrincipal1, 
                    Principal.fromActor(this), 
                    defaultControllers
                );
                let result2 = await CanisterManagementMethods.addController(
                    Support.TechSupportPrincipal2, 
                    Principal.fromActor(this), 
                    defaultControllers
                );
                let result3 = await CanisterManagementMethods.addController(
                    Support.TechSupportPrincipal1, 
                    Principal.fromText(canisterData.managerCanisterPrincipal),
                    defaultControllers
                );
                let result4 = await CanisterManagementMethods.addController(
                    Support.TechSupportPrincipal2, 
                    Principal.fromText(canisterData.managerCanisterPrincipal),
                    defaultControllers
                );
                let result5 = await CanisterManagementMethods.addController(
                    Support.TechSupportPrincipal1, 
                    Principal.fromText(canisterData.frontEndPrincipal),
                    defaultControllers
                );
                let result6 = await CanisterManagementMethods.addController(
                    Support.TechSupportPrincipal2, 
                    Principal.fromText(canisterData.frontEndPrincipal),
                    defaultControllers
                );
            } else {
                let result1 = await CanisterManagementMethods.setToDefualtControllerSettings(
                    Principal.fromActor(this), 
                    defaultControllers
                );
                let result2 = await CanisterManagementMethods.setToDefualtControllerSettings(
                    Principal.fromText(canisterData.managerCanisterPrincipal), 
                    defaultControllers
                );
                let result3 = await CanisterManagementMethods.setToDefualtControllerSettings(
                    Principal.fromText(canisterData.frontEndPrincipal), 
                    defaultControllers
                );
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
            canisterData := canisterData_withOwner;
            let updatedRequestsForAccess = await CanisterManagementMethods.grantAccess(
                callerId,  
                requestsForAccess
            );
            switch(updatedRequestsForAccess){
                case(#ok(requests)){
                    requestsForAccess := requests;
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

    system func preupgrade() {
        profilesArray := Iter.toArray(profilesMap.entries());
    };

    system func postupgrade() {
        profilesArray := [];
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