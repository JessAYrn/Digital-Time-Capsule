import Trie "mo:base/Trie";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Account "../../Serializers/Account";
import JournalTypes "../../Types/Journal/types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "../../Types/Main/types";
import Array "mo:base/Array";
import Journal "../../Journal";
import CanisterManagementMethods "../Main/CanisterManagementMethods";
import HashMap "mo:base/HashMap";
import Debug "mo:base/Debug";
import AssetCanister "../../Types/AssetCanister/types";
import Manager "../../Manager";
import IC "../../Types/IC/types";
import Treasury "../../Treasury";

module{

    private let ic : IC.Self = actor "aaaaa-aa";

    public func create (
        callerId: Principal, 
        userName: Text,
        profilesMap: MainTypes.UserProfilesMap_V2, 
        daoMetaData: MainTypes.DaoMetaData_V3
    ) : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {

        if(Principal.toText(callerId) == "2vxsx-fae"){ return #err(#NotAuthorized);};
        if(not isUserNameAvailable(userName, profilesMap)){ return #err(#UserNameTaken);};

        let callerIdAsText = Principal.toText(callerId);
        let requestForAccessMap = HashMap.fromIter<Text, MainTypes.Approved>(
            Iter.fromArray(daoMetaData.requestsForAccess), 
            Iter.size(Iter.fromArray(daoMetaData.requestsForAccess)), 
            Text.equal,
            Text.hash
        );
        let adminMap = HashMap.fromIter<Text, MainTypes.AdminData>(
            Iter.fromArray(daoMetaData.admin), 
            Iter.size(Iter.fromArray(daoMetaData.admin)), 
            Text.equal,
            Text.hash
        );
        
        let adminData = adminMap.get(callerIdAsText);
        let requestForAccessOption = requestForAccessMap.get(callerIdAsText);
        let requestForAccess = Option.get(requestForAccessOption, false);
        if(adminData == null and requestForAccess == false) { return #err(#NotAuthorized);};

        let existing = profilesMap.get(callerId);

        // If there is an original value, do not update
        switch(existing) {
            case null {
                Cycles.add(1_000_000_000_000);
                let newUserJournal = await Journal.Journal();
                let amountAccepted = await newUserJournal.wallet_receive();
                let treasuryCanister: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
                ignore treasuryCanister.createTreasuryData(callerId);
                ignore CanisterManagementMethods.addControllers(
                    [daoMetaData.managerCanisterPrincipal],
                    Principal.fromActor(newUserJournal)
                );
                let settingMainCanister = await newUserJournal.setMainCanisterPrincipalId();
                let userAccountId = await newUserJournal.canisterAccount();
                let userProfile: MainTypes.UserProfile_V2 = {
                    canisterId = Principal.fromActor(newUserJournal);
                    email = null;
                    userName;
                    userPrincipal = callerId;
                    accountId = ?userAccountId;
                    approved = ?true;
                };
                profilesMap.put(callerId, userProfile);
                
                return #ok(amountAccepted);
            };
            case ( ? existingProfile) { return #err(#AlreadyExists); }
        };
    };

    public func delete(callerId: Principal, profilesMap: MainTypes.UserProfilesMap_V2) : 
    async Result.Result<(), JournalTypes.Error> { let newProfile = profilesMap.delete(callerId); #ok(()); };

    public func isUserNameAvailable(userName: Text, profilesMap: MainTypes.UserProfilesMap_V2) : Bool {
        label lopp_ for((_, userProfile) in profilesMap.entries()){ 
            let inputUserName_ = Text.toLowercase(userName) else continue lopp_;
            let userProfileUserName_ = Text.toLowercase(userProfile.userName) else continue lopp_;
            if((inputUserName_ == userProfileUserName_)){ return false; }; 
        };
        return true;
    };

    private  func key(x: Principal) : Trie.Key<Principal> { return {key = x; hash = Principal.hash(x)}; };

    private func textKey(x: Text) : Trie.Key<Text> { return {key = x; hash = Text.hash(x)} };
}