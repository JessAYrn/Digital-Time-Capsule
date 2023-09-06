import MainTypes "types";
import Manager "../Manager/Manager";
import WasmStore "../Manager/WasmStore";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Error "mo:base/Error";
import Journal "../Journal/Journal";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import NotificationTypes "types.notifications";

module{

    public func appendNotificationsFromJournal(
        caller: Principal, 
        userProfilesMap: MainTypes.UserProfilesMap, 
        notifications: NotificationTypes.Notifications
    ): async [NotificationTypes.Notification]{
        let userJournal = userProfilesMap.get(caller);
        switch(userJournal){
            case null {throw Error.reject("user profile not found")};
            case(?journal){
                let userCanister: Journal.Journal = actor(Principal.toText(journal.canisterId));
                let notifications_ = await userCanister.getNotifications();
                let notificationsBuffer = Buffer.fromArray<NotificationTypes.Notification>(notifications);
                let notificationsBuffer_ = Buffer.fromArray<NotificationTypes.Notification>(notifications_);
                notificationsBuffer.append(notificationsBuffer_);
                return notificationsBuffer.toArray();
            };
        }
    };

    public func updateUserCanisterNotifications(userProfilesMap: MainTypes.UserProfilesMap):
    async (){
        let profilesArray = Iter.toArray(userProfilesMap.entries());
        let length = profilesArray.size();
        var index_ = 0;
        while(index_ < length){
            let (principal, userProfile) = profilesArray[index_];
            let {canisterId} = userProfile;
            let userCanister: Journal.Journal = actor(Principal.toText(canisterId));
            ignore userCanister.updateNotifications();
            index_ += 1;
        };
    };

    public func clearJournalNotifications(caller: Principal, userProfilesMap: MainTypes.UserProfilesMap): async () {
        let result =  userProfilesMap.get(caller);
        switch(result){
            case null { throw Error.reject("Profile Not Found")};
            case(?profile){
                let {canisterId} = profile;
                let userJournal : Journal.Journal = actor(Principal.toText(canisterId));
                await userJournal.clearNotifications();
            };
        };
    };

    public func notifyOfNewStableRelease(canisterData: MainTypes.DaoMetaData): 
    async [NotificationTypes.Notification] {
        let managerCanister : Manager.Manager = actor(canisterData.managerCanisterPrincipal);
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let currentReleaseVersion = await managerCanister.getCurrentReleaseVersion();
        let nextStableVersion = await wasmStore.getNextStableRelease(currentReleaseVersion);
        if(nextStableVersion > currentReleaseVersion){
            let text = Text.concat("New Stable Version Availabe: Version #", Nat.toText(nextStableVersion));
            let key = null;
            return [{text; key;}];
        };
        return [];
    };

};