import MainTypes "../../Types/Main/types";
import Manager "../../Manager";
import WasmStore "../../Types/WasmStore/types";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Error "mo:base/Error";
import Journal "../../Journal";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import NotificationTypes "../../Types/Notifications/types";

module{

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
};