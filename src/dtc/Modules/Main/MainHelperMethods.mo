import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Result "mo:base/Result";
import JournalTypes "../../Types/Journal/types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "../../Types/Main/types";
import Journal "../../Journal";
import CanisterManagementMethods "../Main/CanisterManagementMethods";
import HashMap "mo:base/HashMap";
import Treasury "../../Treasury";

module{

    public func create (
        callerId: Principal, 
        userName: Text,
        profilesMap: MainTypes.UserProfilesMap_V2, 
        daoMetaData: MainTypes.DaoMetaData_V4
    ) : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {

        if(Principal.toText(callerId) == "2vxsx-fae"){ return #err(#NotAuthorized);};
        if(not isUserNameAvailable(userName, profilesMap)){ return #err(#UserNameTaken);};

        let callerIdAsText = Principal.toText(callerId);
        let requestForAccessMap = HashMap.fromIter<Text, MainTypes.Approved>( Iter.fromArray(daoMetaData.requestsForAccess), Iter.size(Iter.fromArray(daoMetaData.requestsForAccess)),  Text.equal, Text.hash);
        let isApprovedForAccess = switch(requestForAccessMap.get(callerIdAsText)){ case null{ false }; case(?approved){ approved } };
        if( not isApprovedForAccess and daoMetaData.founder != "Null") { return #err(#NotAuthorized);};

        let existing = profilesMap.get(callerId);

        // If there is an original value, do not update
        switch(existing) {
            case null {
                Cycles.add<system>(1_000_000_000_000);
                let newUserJournal = await Journal.Journal();
                let amountAccepted = await newUserJournal.wallet_receive();
                let treasuryCanister: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
                ignore treasuryCanister.createTreasuryData(callerId);
                ignore CanisterManagementMethods.addControllers( [daoMetaData.managerCanisterPrincipal], Principal.fromActor(newUserJournal) );
                ignore newUserJournal.setMainCanisterPrincipalId();
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
            case (?_) { return #err(#AccountAlreadyExists); }
        };
    };

    public func delete(callerId: Principal, profilesMap: MainTypes.UserProfilesMap_V2) : 
    async Result.Result<(), JournalTypes.Error> { profilesMap.delete(callerId); #ok(()); };

    public func isUserNameAvailable(userName: Text, profilesMap: MainTypes.UserProfilesMap_V2) : Bool {
        label lopp_ for((_, userProfile) in profilesMap.entries()){ 
            let inputUserName_ = Text.toLowercase(userName) else continue lopp_;
            let userProfileUserName_ = Text.toLowercase(userProfile.userName) else continue lopp_;
            if((inputUserName_ == userProfileUserName_)){ return false; }; 
        };
        return true;
    };
}