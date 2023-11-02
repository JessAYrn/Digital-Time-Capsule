import Trie "mo:base/Trie";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../Ledger/Account";
import JournalTypes "../Types/Journal/types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "../Types/Main/types";
import Journal "../Journal/Journal";
import Ledger "../Ledger/Ledger";
import Blob "mo:base/Blob";
import NotificationTypes "../Types/Main/types";


module{

    private let oneICP : Nat64 = 100_000_000;

    public func readJournal (callerId: Principal, profilesMap: MainTypes.UserProfilesMap) : 
    async Result.Result<(JournalTypes.ReadJournalResult),  JournalTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId)); 
                let (entriesArray, bio, canisterPrincipal) = await journal.readJournal();
                
                return #ok({
                    userJournalData = (entriesArray, bio);
                    email = v.email;
                    userName = v.userName;
                    principal = canisterPrincipal;
                });
            };
        };   
    };

    public func readWalletData(callerId: Principal, profilesMap: MainTypes.UserProfilesMap) : 
    async Result.Result<({ balance : Ledger.ICP; address: [Nat8]; } ), JournalTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId)); 
                let userBalance = await journal.canisterBalance();
                let userAccountId = await journal.canisterAccount();
                
                return #ok({
                    balance = userBalance;
                    address = Blob.toArray(userAccountId);
                });
                
            };
        };
    };

    public func readEntryFileChunk(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, fileId: Text, chunkId: Nat) : 
    async Result.Result<(Blob),JournalTypes.Error>{

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotFound); };
            case ( ? existingProfile){
                let journal: Journal.Journal = actor(Principal.toText(existingProfile.canisterId));
                let entryFile = await journal.readJournalFileChunk(fileId, chunkId);
                entryFile;
            };
        };

    };

    public func readEntryFileSize(callerId: Principal, profilesMap: MainTypes.UserProfilesMap,fileId: Text) : 
    async Result.Result<(Nat),JournalTypes.Error>{

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotFound); };
            case ( ? existingProfile){
                let journal: Journal.Journal = actor(Principal.toText(existingProfile.canisterId));
                let entryFileSize = await journal.readJournalFileSize(fileId);
                entryFileSize;
            };
        };

    };

    public func updatePhotos(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, photos: [JournalTypes.FileMetaData]) : 
    async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotAuthorized); };
            case (? existingProfile){
                let journal: Journal.Journal = actor(Principal.toText(existingProfile.canisterId));
                let status = await journal.updatePhotos(photos);
                return status;
            };
        };
    };

    public func updateBio(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, bio: JournalTypes.Bio) : 
    async Result.Result<(JournalTypes.Bio), JournalTypes.Error> {
        
        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotAuthorized); };
            case (? existingProfile){
                let journal: Journal.Journal = actor(Principal.toText(existingProfile.canisterId));
                let status = await journal.updateBio(bio);
                return status;
            };
        };
    };

    public func createJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap
    ) : async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        let result = profilesMap.get(callerId);
        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let journal: Journal.Journal = actor(Principal.toText(result.canisterId));
                let result_ = await journal.createEntry();
                return result_;
            };
        };
    };

    public func markJournalEntryAsRead(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap, 
        entryKey: JournalTypes.EntryKey
    ) : async Result.Result<(), JournalTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotAuthorized) };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId));
                let entry = await journal.markJournalEntryAsRead(entryKey.entryKey);
                return #ok(());
            };
        };
    };

    public func updateJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap, 
        entry : JournalTypes.JournalEntry,
        entryKey : JournalTypes.EntryKey, 
    ) : async Result.Result<([JournalTypes.JournalEntryExportKeyValuePair]), JournalTypes.Error> {
        let result = profilesMap.get(callerId);
        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let journal: Journal.Journal = actor(Principal.toText(result.canisterId));
                let result_ = await journal.updateJournalEntry(( entryKey.entryKey, entry ));
                return result_;
            };
        };
    };

    public func submitJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap, 
        entryKey : JournalTypes.EntryKey, 
    ) : async Result.Result<[JournalTypes.JournalEntryExportKeyValuePair], JournalTypes.Error> {
        let result = profilesMap.get(callerId);
        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let journal: Journal.Journal = actor(Principal.toText(result.canisterId));
                let result_ = await journal.submitEntry(entryKey.entryKey);
                return result_;
            };
        };
    };

    public func deleteJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap, 
        entryKey : JournalTypes.EntryKey, 
    ) : async Result.Result<(), JournalTypes.Error> {
        let result = profilesMap.get(callerId);
        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let journal: Journal.Journal = actor(Principal.toText(result.canisterId));
                let result_ = await journal.deleteJournalEntry(entryKey.entryKey);
                return result_;
            };
        };
    };

    public func deleteFile(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, fileId: Text) :
    async Result.Result<(), JournalTypes.Error> {

        let result = profilesMap.get(callerId);
        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId));
                let result_ = await journal.deleteFile(fileId);
                return result_;
            };
        };
    };

    public func uploadJournalEntryFile(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, fileId: Text, chunkId: Nat, blobChunk: Blob): 
    async Result.Result<(Text), JournalTypes.Error>{

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ return #err(#NotFound) };
            case (? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId));
                let status = await journal.uploadFileChunk(fileId: Text, chunkId, blobChunk);
                return status;
            };
        };
        
    };


    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

}