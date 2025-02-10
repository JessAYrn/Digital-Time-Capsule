import Result "mo:base/Result";
import UserTypes "../User/types";
import Principal "mo:base/Principal";
import MainTypes "types";
import User "../User/Actor";
import Blob "mo:base/Blob";


module{
    
    public func updatePhotos(callerId: Principal, profilesMap: MainTypes.UserProfilesMap_V2, photos: [UserTypes.FileMetaData]) : 
    async Result.Result<(UserTypes.Bio), UserTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotAuthorized); };
            case (? existingProfile){
                let userCanister: User.User = actor(Principal.toText(existingProfile.canisterId));
                let status = await userCanister.updatePhotos(photos);
                return status;
            };
        };
    };

    public func updateBio(callerId: Principal, profilesMap: MainTypes.UserProfilesMap_V2, bio: UserTypes.Bio) : 
    async Result.Result<(UserTypes.Bio), UserTypes.Error> {
        
        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotAuthorized); };
            case (? existingProfile){
                let userCanister: User.User = actor(Principal.toText(existingProfile.canisterId));
                let status = await userCanister.updateBio(bio);
                return status;
            };
        };
    };

    public func createJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap_V2
    ) : async Result.Result<([UserTypes.JournalEntryExportKeyValuePair]), UserTypes.Error> {
        let result = profilesMap.get(callerId);
        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let userCanister: User.User = actor(Principal.toText(result.canisterId));
                let result_ = await userCanister.createEntry();
                return result_;
            };
        };
    };

    public func markJournalEntryAsRead(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap_V2, 
        entryKey: UserTypes.EntryKey
    ) : async Result.Result<(), UserTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ #err(#NotAuthorized) };
            case(? v){
                let userCanister: User.User = actor(Principal.toText(v.canisterId));
                ignore userCanister.markJournalEntryAsRead(entryKey.entryKey);
                return #ok(());
            };
        };
    };

    public func updateJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap_V2, 
        entry : UserTypes.JournalEntry,
        entryKey : UserTypes.EntryKey, 
    ) : async Result.Result<([UserTypes.JournalEntryExportKeyValuePair]), UserTypes.Error> {
        let result = profilesMap.get(callerId);
        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let userCanister: User.User = actor(Principal.toText(result.canisterId));
                let result_ = await userCanister.updateJournalEntry(( entryKey.entryKey, entry ));
                return result_;
            };
        };
    };

    public func submitJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap_V2, 
        entryKey : UserTypes.EntryKey, 
    ) : async Result.Result<[UserTypes.JournalEntryExportKeyValuePair], UserTypes.Error> {
        let result = profilesMap.get(callerId);
        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let userCanister: User.User = actor(Principal.toText(result.canisterId));
                let result_ = await userCanister.submitEntry(entryKey.entryKey);
                return result_;
            };
        };
    };

    public func deleteJournalEntry(
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap_V2, 
        entryKey : UserTypes.EntryKey, 
    ) : async Result.Result<(), UserTypes.Error> {
        let result = profilesMap.get(callerId);
        switch(result){
            case null{ #err(#NotAuthorized); };
            case(?result){
                let userCanister: User.User = actor(Principal.toText(result.canisterId));
                let result_ = await userCanister.deleteJournalEntry(entryKey.entryKey);
                return result_;
            };
        };
    };

    public func deleteFile(callerId: Principal, profilesMap: MainTypes.UserProfilesMap_V2, fileId: Text) :
    async Result.Result<(), UserTypes.Error> {

        let result = profilesMap.get(callerId);
        switch(result){
            case null{ return #err(#NotFound); };
            case(? v){
                let userCanister: User.User = actor(Principal.toText(v.canisterId));
                let result_ = await userCanister.deleteFile(fileId);
                return result_;
            };
        };
    };

    public func uploadJournalEntryFile(callerId: Principal, profilesMap: MainTypes.UserProfilesMap_V2, fileId: Text, chunkId: Nat, blobChunk: Blob): 
    async Result.Result<(Text), UserTypes.Error>{

        let result = profilesMap.get(callerId);

        switch(result){
            case null{ return #err(#NotFound) };
            case (? v){
                let userCanister: User.User = actor(Principal.toText(v.canisterId));
                let status = await userCanister.uploadFileChunk(fileId: Text, chunkId, blobChunk);
                return status;
            };
        };
        
    };
}