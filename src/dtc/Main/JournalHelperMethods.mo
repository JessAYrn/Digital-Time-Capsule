import Trie "mo:base/Trie";
import Types "types";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../Ledger/Account";
import JournalTypes "../Journal/journal.types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "types";
import Journal "../Journal/Journal";
import Ledger "../Ledger/Ledger";
import Blob "mo:base/Blob";
import NotificationTypes "../Main/types.notifications";


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
                let notifications = await journal.getNotifications();
                
                return #ok({
                    userJournalData = (entriesArray, bio);
                    email = v.email;
                    notifications;
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

    public func readEntry(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, entryKey: JournalTypes.EntryKey) : async Result.Result<JournalTypes.JournalEntry, JournalTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotAuthorized) };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId));
                let entry = await journal.readJournalEntry(entryKey.entryKey);
                return entry;
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

    public func updateJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap, 
        entryKey : ?JournalTypes.EntryKey, 
        entry : ?JournalTypes.JournalEntryInput
    ) : 
    async Result.Result<([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio), JournalTypes.Error> {
        
        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let journal: Journal.Journal = actor(Principal.toText(result.canisterId));
                switch(entry){
                    case null{
                        switch(entryKey){
                            case null{ #err(#NoInputGiven); };
                            case(? entryKeyValue){
                                let journalStatus = await journal.deleteJournalEntry(entryKeyValue.entryKey);
                                return journalStatus;
                            };
                        };
                    };
                    case(? entryValue){
                        switch(entryKey){
                            case null {
                                let status = await journal.createEntry(entryValue);
                                return status;
                            };
                            case (? entryKeyValue){
                                let entryStatus = await journal.updateJournalEntry(entryKeyValue.entryKey, entryValue);
                                return entryStatus;
                            };
                        };
                    };
                }
            };
        };
    };

    public func deleteSubmittedFile(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, fileId: Text) :
    async Result.Result<(), JournalTypes.Error> {

        let result = profilesMap.get(callerId);
        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId));
                let result_ = await journal.deleteSubmittedFile(fileId);
                return result_;
            };
        };
    };

    public func deleteUnsubmittedFile(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, fileId: Text) :
    async Result.Result<(), JournalTypes.Error> {

        let result = profilesMap.get(callerId);
        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId));
                let result_ = await journal.deleteUnsubmittedFile(fileId);
                return result_;
            };
        };
    };

    public func submitFiles(callerId: Principal, profilesMap: MainTypes.UserProfilesMap) : 
    async Result.Result<(), JournalTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ return #err(#NotFound) };
            case (? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId));
                let result = await journal.submitFiles();
                return result;
            };
        };
    };

    public func clearUnsubmittedFiles(callerId: Principal, profilesMap: MainTypes.UserProfilesMap): 
    async Result.Result<(), JournalTypes.Error>{

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ return #err(#NotFound) };
            case (? v){
                let journal: Journal.Journal = actor(Principal.toText(v.canisterId));
                let result = journal.clearUnsubmittedFiles();
                #ok(());
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